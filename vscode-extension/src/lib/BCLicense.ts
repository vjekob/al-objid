import * as fs from "fs";
import * as xml2js from "xml2js";
import { DiagnosticSeverity, Position, Range, Uri, workspace } from "vscode";
import { Diagnostics, DIAGNOSTIC_CODE } from "../features/diagnostics/Diagnostics";
import { getObjectDefinitions, getWorkspaceFolderFiles } from "./ObjectIds";
import { PropertyBag } from "./types/PropertyBag";

const objectTypeToPermissionTypeMap: any = {
    codeunit: "Codeunit",
    enum: "",
    enumextension: "",
    page: "Page",
    pageextension: "",
    permissionset: "",
    permissionsetextension: "",
    query: "Query",
    report: "Report",
    reportextension: "Report",
    table: "TableDescription",
    tableextension: "",
    xmlport: "XMLPort",
};

export class BCLicense {
    private readonly _contents: string;
    private readonly _uri: Uri;
    private _valid: boolean = false;
    private _data: any;

    constructor(path: string, appFolderUri?: Uri) {
        this._uri = appFolderUri || workspace.getWorkspaceFolder(Uri.file(path))!.uri;
        this._contents = fs.readFileSync(path, { encoding: "utf16le" }).toString() || "";
        if (!this._contents) {
            return;
        }

        const data = this._contents.substring(this._contents.indexOf("<License>"));
        xml2js.parseString(data, (error, result) => {
            if (!error) {
                this._data = result;
                this._valid = true;
                this._uri;
            }
        });
    }

    get isValid() {
        return this._valid;
    }

    get uri(): Uri {
        return this._uri;
    }

    public async validate() {
        const uris = await getWorkspaceFolderFiles(this._uri);
        const objects = await getObjectDefinitions(uris);

        let cache: PropertyBag<any> = {};
        let uriCache: PropertyBag<Uri> = {};
        for (let object of objects) {
            if (!uriCache[object.path]) {
                const uri = Uri.file(object.path);
                uriCache[object.path] = uri;
            }

            const objectUri = uriCache[object.path];
            Diagnostics.instance.resetForUri(objectUri);

            // Skipping obsolete objects
            if (object.properties?.obsoletestate?.toLowerCase() === "removed") {
                continue;
            }

            // Skipping temporary tables
            if (object.properties?.tabletype?.toLowerCase() === "temporary") {
                continue;
            }

            const diagnose = Diagnostics.instance.createDiagnostics(objectUri, `bclicense.${object.type}.${object.id}`);
            const mappedType = objectTypeToPermissionTypeMap[object.type];
            let permissions = cache[mappedType];
            if (!permissions) {
                const setup = this._data.License.PermissionCollections[0].pl.find(
                    (obj: any) => obj?.$?.t === mappedType
                );
                cache[mappedType] = setup;
            }

            permissions = cache[mappedType];
            if (permissions) {
                const range = permissions?.ps[0]?.p?.find(
                    (line: any) => line?.$?.f <= object.id && line?.$?.t >= object.id
                );
                if (range) {
                    if ((range?.$?.pbm & 2) === 2) {
                        continue;
                    }
                }
                diagnose(
                    new Range(
                        new Position(object.line, object.character),
                        new Position(object.line, object.character + object.id.toString().length)
                    ),
                    `${object.type} ${object.id} is not included in the license`,
                    DiagnosticSeverity.Error,
                    DIAGNOSTIC_CODE.BCLICENSE.UNAVAILABLE
                );
            }
        }
    }
}
