import { DiagnosticSeverity, Uri, workspace, WorkspaceFolder } from "vscode";
import path = require("path");
import * as fs from "fs";
import { LogLevel, Output } from "../features/Output";
import { stringify, parse } from "comment-json";
import { PropertyBag } from "./PropertyBag";
import { NinjaALRange } from "./types";
import { UI } from "./UI";
import { LABELS, TIME } from "./constants";
import { CreateDiagnostic, Diagnostics, DIAGNOSTIC_CODE } from "../features/Diagnostics";
import { ObjIdConfigSymbols } from "./ObjIdConfigSymbols";

enum ConfigurationProperty {
    AuthKey = "authKey",
    AppPoolId = "appPoolId",
    BackEndUrl = "backEndUrl",
    BackEndApiKey = "backEndApiKey",
    Ranges = "idRanges",
    BcLicense = "bcLicense",
    LicenseReport = "licenseReport",
}

export const CONFIG_FILE_NAME = ".objidconfig";

const COMMENTS: PropertyBag<string> = {
    [ConfigurationProperty.AuthKey]: "This is the authorization key for all back-end communication. DO NOT MODIFY OR DELETE THIS VALUE!",
    [ConfigurationProperty.Ranges]: "You can customize and describe your logical ranges here",
    [ConfigurationProperty.AppPoolId]: "Application pool this app belongs to. When defined, your object ID assignments are not per app, but per pool. DO NOT MANUALLY MODIFY THIS VALUE!",
    [ConfigurationProperty.BcLicense]: "Customer BC license file (*.bclicense) to check object assignments against",
    [ConfigurationProperty.LicenseReport]: "Customer license report file (*.txt) to check object assignments against",
};

const idRangeWarnings: PropertyBag<number> = {};


export class ObjIdConfig {
    private static _instances = new WeakMap<Uri, ObjIdConfig>();
    private readonly _folder: WorkspaceFolder;
    private readonly _uri: Uri;
    private readonly _path: fs.PathLike;
    private readonly _name: string;
    private _symbols: ObjIdConfigSymbols;
    private _lastReadContent: string = "{}";

    public static instance(uri: Uri, name: string): ObjIdConfig {
        let cached = this._instances.get(uri);
        if (cached) {
            return cached;
        }

        cached = new ObjIdConfig(uri, name);
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
            if (e.code !== "ENOENT") Output.instance.log(`Cannot read file ${path}: ${e}`, LogLevel.Info);
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
        if (!config[key]) config[key] = [{
            type: "LineComment",
            value: ` ${value}`,
        }];
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

    get authKey(): string {
        return this.getProperty(ConfigurationProperty.AuthKey) || "";
    }

    set authKey(value: string) {
        this.setProperty(ConfigurationProperty.AuthKey, value);
    }

    private getIdRanges() {
        return this.getProperty<NinjaALRange[]>(ConfigurationProperty.Ranges) || [];
    }

    private showRangeWarning<T>(range: NinjaALRange, showWarning: () => Promise<T>, rewarnDelay: number): Promise<T> {
        return new Promise<T>(async (resolve) => {
            const key = `${this._path}:${range.from}:${range.to}:${range.description}`;
            if ((idRangeWarnings[key] || 0) < Date.now() - rewarnDelay) {
                idRangeWarnings[key] = Date.now();
                const result = await showWarning();
                delete idRangeWarnings[key];
                resolve(result);
            }
        });
    }

    private async validateRange(range: NinjaALRange, ordinal: number, diagnose: CreateDiagnostic) {
        const idRanges = await this._symbols.idRanges;
        if (!idRanges) {
            return;
        }

        const idRange = this._symbols.properties.idRanges(idRanges.children[ordinal]);
        const from = idRange.from();
        const to = idRange.to();

        if (from) {
            if (typeof range.from !== "number") {
                diagnose(from.range, `Syntax error: Invalid value (non-zero number expected; found ${JSON.stringify(range.from)}).`, DiagnosticSeverity.Error, DIAGNOSTIC_CODE.OBJIDCONFIG.INVALIDTYPE);
            }
        } else {
            diagnose(idRange.range, `Syntax error: Missing "from" property`, DiagnosticSeverity.Error, DIAGNOSTIC_CODE.OBJIDCONFIG.MISSING_PROPERTY);
        }
        if (to) {
            if (typeof range.to !== "number") {
                diagnose(to.range, `Syntax error: Invalid value (non-zero number expected; found ${JSON.stringify(range.to)}).`, DiagnosticSeverity.Error, DIAGNOSTIC_CODE.OBJIDCONFIG.INVALIDTYPE);
            }
        } else {
            diagnose(idRange.range, `Syntax error: Missing "to" property`, DiagnosticSeverity.Error, DIAGNOSTIC_CODE.OBJIDCONFIG.MISSING_PROPERTY);
        }
    }

    private getValidRanges(ranges: NinjaALRange[], diagnose: CreateDiagnostic): NinjaALRange[] {
        const result = [];
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            if (typeof range.from === "number" && typeof range.to === "number" && range.from && range.to) {
                result.push(range);
            } else {
                this.validateRange(range, i, diagnose);
                this.showRangeWarning(range, () => UI.ranges.showInvalidRangeTypeError(this._name, range), TIME.FIVE_MINUTES);
            }
        }
        return result;
    }

    private async reportRangesOverlapDiagnostic(ordinal1: number, ordinal2: number, diagnose: CreateDiagnostic) {
        const idRanges = await this._symbols.idRanges;
        if (!idRanges) {
            return;
        }

        const range1 = this._symbols.properties.idRanges(idRanges.children[ordinal1]);
        const range2 = this._symbols.properties.idRanges(idRanges.children[ordinal2]);

        diagnose(range1.range, `Invalid range: Overlaps with range ${range2.from()?.detail}..${range2.to()?.detail}`, DiagnosticSeverity.Warning, DIAGNOSTIC_CODE.OBJIDCONFIG.RANGES_OVERLAP);
        diagnose(range2.range, `Invalid range: Overlaps with range ${range1.from()?.detail}..${range1.to()?.detail}`, DiagnosticSeverity.Warning, DIAGNOSTIC_CODE.OBJIDCONFIG.RANGES_OVERLAP);
    }

    private rangesOverlap(ranges: NinjaALRange[], diagnose: CreateDiagnostic): boolean {
        if (ranges.length <= 1) {
            return false;
        }

        for (let i = 0; i < ranges.length - 1; i++) {
            for (let j = i + 1; j < ranges.length; j++) {
                if (ranges[i].from <= ranges[j].to && ranges[i].to >= ranges[j].from) {
                    this.reportRangesOverlapDiagnostic(i, j, diagnose);
                    this.showRangeWarning(ranges[i], () => UI.ranges.showRangeOverlapError(this._name, ranges[i], ranges[j]), TIME.TWO_MINUTES);
                    return true;
                }
            }
        }

        return false;
    }

    private async reportToBeforeFrom(ordinal: number, diagnose: CreateDiagnostic) {
        const idRanges = await this._symbols.idRanges;
        if (!idRanges) {
            return;
        }

        const range = this._symbols.properties.idRanges(idRanges.children[ordinal]);
        diagnose(range.range, `Invalid range: "to" must not be less than "from".`, DiagnosticSeverity.Error, DIAGNOSTIC_CODE.OBJIDCONFIG.TO_BEFORE_FROM);
    }

    private async reportMissingDescription(ordinal: number, diagnose: CreateDiagnostic) {
        const idRanges = await this._symbols.idRanges;
        if (!idRanges) {
            return;
        }

        const range = this._symbols.properties.idRanges(idRanges.children[ordinal]);
        diagnose(range.range, `Missing description for range ${range.from()?.detail}..${range.to()?.detail}.`, DiagnosticSeverity.Information, DIAGNOSTIC_CODE.OBJIDCONFIG.TO_BEFORE_FROM);
    }

    get idRanges(): NinjaALRange[] {
        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.idranges");

        // Clone the ranges array first
        const ranges = this.getIdRanges().map(range => ({ ...range }));

        let invalid = false;
        if (this.rangesOverlap(ranges, diagnose)) {
            invalid = true;
        }

        ranges.forEach((range, ordinal) => {
            if ((typeof range.from !== "number") || (typeof range.to !== "number") || (!range.to) || (!range.from)) {
                // This is a problem, but it's reported elsewhere
                return;
            }

            if (!range.description) {
                this.reportMissingDescription(ordinal, diagnose);
            }

            if (range.to < range.from) {
                const { from, to, description } = range;
                this.reportToBeforeFrom(ordinal, diagnose);
                this.showRangeWarning(range, () => UI.ranges.showInvalidRangeFromToError(this._name, range), TIME.FIVE_MINUTES).then(result => {
                    if (result === LABELS.FIX) {
                        let fixed = false;
                        const ranges = this.getIdRanges();
                        for (let original of ranges) {
                            if (original.from === from && original.to === to && original.description === description) {
                                original.from = to;
                                original.to = from;
                                fixed = true;
                            }
                        }
                        if (fixed) {
                            this.idRanges = ranges;
                        }
                    }
                });
                range.from = to;
                range.to = from;
            }
        });

        // First collect valid ranges to run remaining validations
        const validRanges = this.getValidRanges(ranges, diagnose);

        // Then return either empty array or valid ranges
        return invalid ? [] : validRanges;
    }

    set idRanges(value: NinjaALRange[]) {
        this.setProperty(ConfigurationProperty.Ranges, value);
    }

    get appPoolId(): string | undefined {
        return this.getProperty(ConfigurationProperty.AppPoolId);
    }

    set appPoolId(value: string | undefined) {
        this.setProperty(ConfigurationProperty.AppPoolId, value);
    }

    private async validateBcLicense(bcLicense: string) {
        if (!bcLicense) {
            return;
        }

        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.bcLicense");

        if (!fs.existsSync(path.join(this._folder.uri.fsPath, bcLicense))) {
            const bcLicenseSymbol = await this._symbols.bcLicense;
            if (bcLicenseSymbol) {
                diagnose(bcLicenseSymbol?.range, `Cannot find license file.`, DiagnosticSeverity.Warning, DIAGNOSTIC_CODE.OBJIDCONFIG.FILE_NOT_FOUND);
            }
        }
    }

    get bcLicense(): string | undefined {
        const bcLicense = this.getProperty<string>(ConfigurationProperty.BcLicense);
        this.validateBcLicense(bcLicense);
        return bcLicense;
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
