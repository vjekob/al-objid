import { DiagnosticSeverity, DocumentSymbol, Uri, workspace, WorkspaceFolder } from "vscode";
import * as path from "path";
import * as fs from "fs";
import { LogLevel, Output } from "../features/Output";
import { stringify, parse } from "comment-json";
import { PropertyBag } from "./PropertyBag";
import { ConfigurationProperty, NinjaALRange } from "./types";
import { UI } from "./UI";
import { ALObjectType, CONFIG_FILE_NAME, LABELS, TIME } from "./constants";
import { CreateDiagnostic, Diagnostics, DIAGNOSTIC_CODE } from "../features/Diagnostics";
import { ObjIdConfigSymbols } from "./ObjIdConfigSymbols";
import { BCLicense } from "./BCLicense";

const COMMENTS: PropertyBag<string> = {
    [ConfigurationProperty.AuthKey]:
        "This is the authorization key for all back-end communication. DO NOT MODIFY OR DELETE THIS VALUE!",
    [ConfigurationProperty.Ranges]: "You can customize and describe your logical ranges here",
    [ConfigurationProperty.ObjectRanges]: "Here you can define your logical ranges per object type",
    [ConfigurationProperty.AppPoolId]:
        "Application pool this app belongs to. When defined, your object ID assignments are not per app, but per pool. DO NOT MANUALLY MODIFY THIS VALUE!",
    [ConfigurationProperty.BcLicense]:
        "Customer BC license file (*.bclicense) to check object assignments against",
    [ConfigurationProperty.LicenseReport]:
        "Customer license report file (*.txt) to check object assignments against",
};

const idRangeWarnings: PropertyBag<number> = {};

export class __ObjIdConfig_obsolete_ {
    private static _instances = new WeakMap<Uri, __ObjIdConfig_obsolete_>();
    private readonly _folder: WorkspaceFolder;
    private readonly _uri: Uri;
    private readonly _path: fs.PathLike;
    private readonly _name: string;
    private _symbols: ObjIdConfigSymbols;
    private _lastReadContent: string = "{}";
    private _bcLicense: string | undefined = undefined;
    private _bcLicensePromise?: Promise<BCLicense | undefined>;

    public static instance(uri: Uri, name: string): __ObjIdConfig_obsolete_ {
        let cached = this._instances.get(uri);
        if (cached) {
            return cached;
        }

        cached = new __ObjIdConfig_obsolete_(uri, name);
        this._instances.set(uri, cached);
        return cached;
    }

    private constructor(uri: Uri, name: string) {
        this._folder = workspace.getWorkspaceFolder(uri)!;
        this._path = path.join(this._folder.uri.fsPath, CONFIG_FILE_NAME);
        this._name = name;
        this._uri = Uri.file(this._path);
        this._symbols = new ObjIdConfigSymbols(this._uri);
    }

    private read(): any {
        try {
            const content = fs.readFileSync(this._path).toString() || "{}";
            if (content !== this._lastReadContent) {
                this._symbols = new ObjIdConfigSymbols(this._uri);
            }
            this._lastReadContent = content;
            return parse(this._lastReadContent) as any;
        } catch (e: any) {
            if (e.code !== "ENOENT")
                Output.instance.log(`Cannot read file ${path}: ${e}`, LogLevel.Info);
            return {};
        }
    }

    private write(object: any) {
        fs.writeFileSync(this._path, stringify(object, null, 2));
    }

    private setComment(config: any, property: ConfigurationProperty) {
        const value = COMMENTS[property];
        if (!value) {
            return;
        }

        const key = Symbol.for(`before:${property}`);
        if (!config[key])
            config[key] = [
                {
                    type: "LineComment",
                    value: ` ${value}`,
                },
            ];
    }

    private removeComment(config: any, property: ConfigurationProperty) {
        delete config[Symbol.for(`before:${property}`)];
    }

    private getProperty<T>(property: ConfigurationProperty): T {
        let config = this.read();
        return config[property];
    }

    private setProperty<T>(property: ConfigurationProperty, value?: T) {
        let config = this.read();
        if (value) {
            config[property] = value;
            this.setComment(config, property);
        } else {
            delete config[property];
            this.removeComment(config, property);
        }
        this.write(config);
    }

    get uri(): Uri {
        return this._uri;
    }

    get path(): fs.PathLike {
        return this._path;
    }

    get authKey(): string {
        return this.getProperty(ConfigurationProperty.AuthKey) || "";
    }

    set authKey(value: string) {
        this.setProperty(ConfigurationProperty.AuthKey, value);
    }

    private getIdRanges() {
        return this.getProperty<NinjaALRange[]>(ConfigurationProperty.Ranges) || [];
    }

    private showRangeWarning<T>(
        range: NinjaALRange,
        showWarning: () => Thenable<T>,
        rewarnDelay: number
    ): Promise<T> {
        return new Promise<T>(async resolve => {
            const key = `${this._path}:${range.from}:${range.to}:${range.description}`;
            if ((idRangeWarnings[key] || 0) < Date.now() - rewarnDelay) {
                idRangeWarnings[key] = Date.now();
                const result = await showWarning();
                delete idRangeWarnings[key];
                resolve(result);
            }
        });
    }

    private async getIdRangesSymbol(objectType?: string): Promise<DocumentSymbol | undefined> {
        let idRanges: DocumentSymbol | undefined;
        if (objectType) {
            const objectRanges = await this._symbols.objectRanges;
            idRanges = objectRanges!.children.find(child => child.name === objectType);
        } else {
            idRanges = await this._symbols.idRanges;
        }
        return idRanges;
    }

    private async reportInvalidRange(
        range: NinjaALRange,
        ordinal: number,
        diagnose: CreateDiagnostic,
        objectType?: string
    ) {
        const idRanges = await this.getIdRangesSymbol(objectType);
        if (!idRanges) {
            return;
        }

        const idRange = this._symbols.properties.idRanges(idRanges.children[ordinal]);
        const from = idRange.from();
        const to = idRange.to();

        if (from) {
            if (typeof range.from !== "number") {
                diagnose(
                    from.range,
                    `Syntax error: Invalid value (non-zero number expected; found ${JSON.stringify(
                        range.from
                    )}).`,
                    DiagnosticSeverity.Error,
                    DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_TYPE
                );
            }
        } else {
            diagnose(
                idRange.range,
                `Syntax error: Missing "from" property`,
                DiagnosticSeverity.Error,
                DIAGNOSTIC_CODE.OBJIDCONFIG.MISSING_PROPERTY
            );
        }
        if (to) {
            if (typeof range.to !== "number") {
                diagnose(
                    to.range,
                    `Syntax error: Invalid value (non-zero number expected; found ${JSON.stringify(
                        range.to
                    )}).`,
                    DiagnosticSeverity.Error,
                    DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_TYPE
                );
            }
        } else {
            diagnose(
                idRange.range,
                `Syntax error: Missing "to" property`,
                DiagnosticSeverity.Error,
                DIAGNOSTIC_CODE.OBJIDCONFIG.MISSING_PROPERTY
            );
        }
    }

    private getValidRanges(
        ranges: NinjaALRange[],
        diagnose: CreateDiagnostic,
        objectType?: string
    ): NinjaALRange[] {
        const result = [];
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            if (
                typeof range.from === "number" &&
                typeof range.to === "number" &&
                range.from &&
                range.to
            ) {
                result.push(range);
            } else {
                this.reportInvalidRange(range, i, diagnose, objectType);
                this.showRangeWarning(
                    range,
                    () => UI.ranges.showInvalidRangeTypeError(this._name, range),
                    TIME.FIVE_MINUTES
                );
            }
        }
        return result;
    }

    private async reportRangesOverlapDiagnostic(
        ordinal1: number,
        ordinal2: number,
        diagnose: CreateDiagnostic,
        objectType?: string
    ) {
        const idRanges = await this.getIdRangesSymbol(objectType);
        if (!idRanges) {
            return;
        }

        const range1 = this._symbols.properties.idRanges(idRanges.children[ordinal1]);
        const range2 = this._symbols.properties.idRanges(idRanges.children[ordinal2]);

        diagnose(
            range1.range,
            `Invalid range: Overlaps with range ${range2.from()?.detail}..${range2.to()?.detail}`,
            DiagnosticSeverity.Warning,
            DIAGNOSTIC_CODE.OBJIDCONFIG.RANGES_OVERLAP
        );
        diagnose(
            range2.range,
            `Invalid range: Overlaps with range ${range1.from()?.detail}..${range1.to()?.detail}`,
            DiagnosticSeverity.Warning,
            DIAGNOSTIC_CODE.OBJIDCONFIG.RANGES_OVERLAP
        );
    }

    private rangesOverlap(
        ranges: NinjaALRange[],
        diagnose: CreateDiagnostic,
        objectType?: string
    ): boolean {
        if (ranges.length <= 1) {
            return false;
        }

        for (let i = 0; i < ranges.length - 1; i++) {
            for (let j = i + 1; j < ranges.length; j++) {
                if (ranges[i].from <= ranges[j].to && ranges[i].to >= ranges[j].from) {
                    this.reportRangesOverlapDiagnostic(i, j, diagnose, objectType);
                    this.showRangeWarning(
                        ranges[i],
                        () => UI.ranges.showRangeOverlapError(this._name, ranges[i], ranges[j]),
                        TIME.TWO_MINUTES
                    );
                    return true;
                }
            }
        }

        return false;
    }

    private async reportToBeforeFrom(
        ordinal: number,
        diagnose: CreateDiagnostic,
        objectType?: string
    ) {
        const idRanges = await this.getIdRangesSymbol(objectType);
        if (!idRanges) {
            return;
        }

        const range = this._symbols.properties.idRanges(idRanges.children[ordinal]);
        diagnose(
            range.range,
            `Invalid range: "to" must not be less than "from".`,
            DiagnosticSeverity.Error,
            DIAGNOSTIC_CODE.OBJIDCONFIG.TO_BEFORE_FROM
        );
    }

    private async reportMissingDescription(
        ordinal: number,
        diagnose: CreateDiagnostic,
        objectType?: string
    ) {
        const idRanges = await this.getIdRangesSymbol(objectType);
        if (!idRanges) {
            return;
        }

        const range = this._symbols.properties.idRanges(idRanges.children[ordinal]);
        diagnose(
            range.range,
            `Missing description for range ${range.from()?.detail}..${range.to()?.detail}.`,
            DiagnosticSeverity.Information,
            DIAGNOSTIC_CODE.OBJIDCONFIG.TO_BEFORE_FROM
        );
    }

    private validateRanges(
        ranges: NinjaALRange[],
        diagnose: CreateDiagnostic,
        objectType?: string
    ): NinjaALRange[] {
        let invalid = false;
        if (this.rangesOverlap(ranges, diagnose, objectType)) {
            invalid = true;
        }

        ranges.forEach((range, ordinal) => {
            if (
                typeof range.from !== "number" ||
                typeof range.to !== "number" ||
                !range.to ||
                !range.from
            ) {
                // This is a problem, but it's reported elsewhere
                return;
            }

            if (!range.description) {
                this.reportMissingDescription(ordinal, diagnose, objectType);
            }

            if (range.to < range.from) {
                const { from, to, description } = range;
                this.reportToBeforeFrom(ordinal, diagnose, objectType);
                this.showRangeWarning(
                    range,
                    () => UI.ranges.showInvalidRangeFromToError(this._name, range),
                    TIME.FIVE_MINUTES
                ).then(result => {
                    if (result === LABELS.FIX) {
                        let fixed = false;
                        const ranges = objectType
                            ? this.getAllObjectRanges()[objectType] || []
                            : this.getIdRanges();
                        for (let original of ranges) {
                            if (
                                original.from === from &&
                                original.to === to &&
                                original.description === description
                            ) {
                                original.from = to;
                                original.to = from;
                                fixed = true;
                            }
                        }
                        if (fixed) {
                            if (objectType) {
                                this.setObjectRanges(objectType, ranges);
                            } else {
                                this.idRanges = ranges;
                            }
                        }
                    }
                });
                range.from = to;
                range.to = from;
            }
        });

        // First collect valid ranges to run remaining validations
        const validRanges = this.getValidRanges(ranges, diagnose, objectType);

        // Then return either empty array or valid ranges
        return invalid ? [] : validRanges;
    }

    hasIdRanges(): boolean {
        return this.getIdRanges().length > 0;
    }

    get idRanges(): NinjaALRange[] {
        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.idranges");

        // Clone the ranges array first
        const ranges = this.getIdRanges().map(range => ({ ...range }));
        return this.validateRanges(ranges, diagnose);
    }

    set idRanges(value: NinjaALRange[]) {
        this.setProperty(ConfigurationProperty.Ranges, value);
    }

    get logicalRangeNames(): string[] {
        const names: string[] = [];
        const ranges = this.getIdRanges();
        for (let range of ranges) {
            if (
                names.find(
                    name => name.toLowerCase().trim() === range.description.toLowerCase().trim()
                )
            ) {
                continue;
            }
            names.push(range.description);
        }
        return names;
    }

    private getAllObjectRanges(): PropertyBag<NinjaALRange[]> {
        return this.getProperty(ConfigurationProperty.ObjectRanges) || {};
    }

    private getObjectRangeDiagnoseMethod(): CreateDiagnostic {
        return Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.idranges");
    }

    getObjectRanges(objectType: string, diagnose?: CreateDiagnostic): NinjaALRange[] {
        const allObjectRanges = this.getAllObjectRanges();
        return allObjectRanges[objectType]
            ? this.validateRanges(
                  allObjectRanges[objectType].map(range => ({ ...range })),
                  diagnose || this.getObjectRangeDiagnoseMethod(),
                  objectType
              )
            : this.idRanges;
    }

    setObjectRanges(objectType: string, value: NinjaALRange[] | undefined) {
        const allObjectRanges = this.getAllObjectRanges();
        if (value) {
            allObjectRanges[objectType] = value;
        } else {
            delete allObjectRanges[objectType];
        }
        this.setProperty(ConfigurationProperty.ObjectRanges, allObjectRanges);
    }

    public async validateObjectRanges() {
        const objectRanges = this.getAllObjectRanges();
        if (!objectRanges) {
            return;
        }

        const diagnose = Diagnostics.instance.createDiagnostics(
            this._uri,
            "objidconfig.objectRanges"
        );
        const validTypes = Object.values<string>(ALObjectType);

        const objectRangesSymbol = await this._symbols.objectRanges;
        if (!objectRangesSymbol) {
            return;
        }
        for (let child of objectRangesSymbol!.children) {
            const type = child.name;
            if (!validTypes.includes(type)) {
                // Report error
                diagnose(
                    child.selectionRange,
                    `Invalid object type: ${type}.`,
                    DiagnosticSeverity.Error,
                    DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_OBJECT_TYPE
                );
                continue;
            }
            this.getObjectRanges(type, diagnose);
        }
    }

    get explicitObjectTypeRanges(): string[] {
        const allObjectRanges = this.getAllObjectRanges();
        const validTypes = Object.values<string>(ALObjectType);
        return Object.keys(allObjectRanges).filter(type => validTypes.includes(type));
    }

    get appPoolId(): string | undefined {
        return this.getProperty(ConfigurationProperty.AppPoolId);
    }

    set appPoolId(value: string | undefined) {
        this.setProperty(ConfigurationProperty.AppPoolId, value);
    }

    private async validateBcLicense(path: string): Promise<boolean> {
        if (!path) {
            return false;
        }

        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.bcLicense");

        if (!fs.existsSync(path)) {
            const bcLicenseSymbol = await this._symbols.bcLicense;
            if (bcLicenseSymbol) {
                diagnose(
                    bcLicenseSymbol?.range,
                    `Cannot find license file.`,
                    DiagnosticSeverity.Warning,
                    DIAGNOSTIC_CODE.OBJIDCONFIG.LICENSE_FILE_NOT_FOUND
                );
                return false;
            }
        }

        return true;
    }

    get bcLicense(): string | undefined {
        const relativePath = this.getProperty<string>(ConfigurationProperty.BcLicense);
        if (!relativePath) {
            return;
        }

        this._bcLicense = path.isAbsolute(relativePath)
            ? relativePath
            : path.join(this._folder.uri.fsPath, relativePath);
        this.validateBcLicense(this._bcLicense).then(exists => {
            if (!exists) {
                return;
            }

            this._bcLicensePromise = new Promise<BCLicense | undefined>(resolve =>
                resolve(new BCLicense(this._bcLicense!))
            );
        });

        return this._bcLicense;
    }

    set bcLicense(value: string | undefined) {
        this.setProperty(ConfigurationProperty.BcLicense, value);
    }

    async getLicenseObject(): Promise<BCLicense | undefined> {
        if (!this._bcLicensePromise) {
            return undefined;
        }

        return await this._bcLicensePromise;
    }

    get licenseReport(): string | undefined {
        return this.getProperty(ConfigurationProperty.LicenseReport);
    }

    /* TODO Implement custom back-end in .objIdConfig
    get backEndUrl(): string {
        return this.getProperty(ConfigurationProperty.BackEndUrl) || "";
    }

    set backEndUri(value: string) {
        this.setProperty(ConfigurationProperty.BackEndUrl, value);
    }

    get backEndApiKey(): string {
        return this.getProperty(ConfigurationProperty.BackEndApiKey) || "";
    }

    set backEndApiKey(value: string) {
        this.setProperty(ConfigurationProperty.BackEndApiKey, value);
    }
    */
}
