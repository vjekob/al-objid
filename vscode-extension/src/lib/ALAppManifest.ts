import * as fs from "fs";
import { Uri } from "vscode";
import { ALRange } from "./types";

interface ALAppJson {
    id: string;
    name: string;
    version: string;
    idRanges: ALRange[];
    preprocessorSymbols: string[];
}

export class ALAppManifest {
    private readonly _uri: Uri;
    private readonly _manifest: ALAppJson;

    private constructor(uri: Uri, manifest: ALAppJson) {
        this._uri = uri;
        this._manifest = manifest;
    }

    public static tryCreate(uri: Uri): ALAppManifest | undefined {
        try {
            const contents = fs.readFileSync(uri.fsPath).toString();
            const appObj = JSON.parse(contents);

            const expectProperty = (property: string, type = "string") =>
                appObj.hasOwnProperty(property) && typeof appObj[property] === type;
            if (!expectProperty("id") || !expectProperty("name") || !expectProperty("version")) {
                return;
            }

            if (!appObj.idRanges && appObj.idRange) {
                appObj.idRanges = [appObj.idRange];
            }
            if (!expectProperty("idRanges", "object")) {
                return;
            }

            return new ALAppManifest(uri, appObj);
        } catch {
            return;
        }
    }

    public get uri() {
        return this._uri;
    }

    public get id() {
        return this._manifest.id;
    }

    public get name() {
        return this._manifest.name;
    }

    public get version() {
        return this._manifest.version;
    }

    public get idRanges() {
        return this._manifest.idRanges;
    }
}
