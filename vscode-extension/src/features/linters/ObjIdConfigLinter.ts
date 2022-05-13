import * as fs from "fs";
import { commands, DiagnosticSeverity, DocumentSymbol, Uri } from "vscode";
import { LABELS, TIME } from "../../lib/constants";
import { ConfigurationProperty } from "../../lib/ObjIdConfig";
import { ALObjectType } from "../../lib/types/ALObjectType";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { UI } from "../../lib/UI";
import { CreateDiagnostic, Diagnostics, DIAGNOSTIC_CODE } from "../Diagnostics";
import { jsonAvailable } from "./jsonAvailable";

export class ObjIdConfigLinter {
    private readonly _uri: Uri;
    private readonly _symbolsPromise: Promise<DocumentSymbol[] | undefined>;
    private readonly _idRangesPromise: Promise<DocumentSymbol | undefined>;
    private readonly _objectRangesPromise: Promise<DocumentSymbol | undefined>;
    private readonly _bcLicensePromise: Promise<DocumentSymbol | undefined>;
    private _idRangeWarnings: PropertyBag<number> = {};

    constructor(uri: Uri) {
        this._uri = uri;

        if (!fs.existsSync(uri.fsPath)) {
            this._symbolsPromise = Promise.resolve(undefined);
            this._idRangesPromise = Promise.resolve(undefined);
            this._objectRangesPromise = Promise.resolve(undefined);
            this._bcLicensePromise = Promise.resolve(undefined);
            return;
        }

        this._symbolsPromise = new Promise(async resolve => {
            if (!(await jsonAvailable)) {
                resolve(undefined);
                return;
            }

            const symbols = await (commands.executeCommand("vscode.executeDocumentSymbolProvider", uri) as Promise<
                DocumentSymbol[] | undefined
            >);
            resolve(symbols);
        });

        this._idRangesPromise = this.getPropertyPromise(ConfigurationProperty.Ranges);
        this._objectRangesPromise = this.getPropertyPromise(ConfigurationProperty.ObjectRanges);
        this._bcLicensePromise = this.getPropertyPromise(ConfigurationProperty.BcLicense);
    }

    private getPropertyPromise(name: string) {
        return new Promise<DocumentSymbol | undefined>(resolve => {
            this._symbolsPromise.then(symbols => {
                if (!symbols) {
                    resolve(undefined);
                    return;
                }

                const property = symbols.find(symbol => symbol.name === name)!;
                resolve(property);
            });
        });
    }

    private _properties = {
        idRanges: (range: DocumentSymbol) => ({
            ...range,
            from: () => range.children.find(child => child.name === "from"),
            to: () => range.children.find(child => child.name === "to"),
        }),
    };

    // //#region Old, to be deleted

    // //TODO Refactor all of this validation code in this region
    // private async getIdRangesSymbol(objectType?: string): Promise<DocumentSymbol | undefined> {
    //     let idRanges: DocumentSymbol | undefined;
    //     if (objectType) {
    //         const objectRanges = await this._objectRangesPromise;
    //         idRanges = objectRanges!.children.find(child => child.name === objectType);
    //     } else {
    //         idRanges = await this._idRangesPromise;
    //     }
    //     return idRanges;
    // }

    // private showRangeWarning<T>(range: NinjaALRange, showWarning: () => Thenable<T>, rewarnDelay: number): Promise<T> {
    //     return new Promise<T>(async resolve => {
    //         const key = `${this._uri.fsPath}:${range.from}:${range.to}:${range.description}`;
    //         if ((this._idRangeWarnings[key] || 0) < Date.now() - rewarnDelay) {
    //             this._idRangeWarnings[key] = Date.now();
    //             const result = await showWarning();
    //             delete this._idRangeWarnings[key];
    //             resolve(result);
    //         }
    //     });
    // }

    // private async reportInvalidRange(
    //     range: NinjaALRange,
    //     ordinal: number,
    //     diagnose: CreateDiagnostic,
    //     objectType?: string
    // ) {
    //     const idRanges = await this.getIdRangesSymbol(objectType);
    //     if (!idRanges) {
    //         return;
    //     }

    //     const idRange = this._properties.idRanges(idRanges.children[ordinal]);
    //     const from = idRange.from();
    //     const to = idRange.to();

    //     if (from) {
    //         if (typeof range.from !== "number") {
    //             diagnose(
    //                 from.range,
    //                 `Syntax error: Invalid value (non-zero number expected; found ${JSON.stringify(range.from)}).`,
    //                 DiagnosticSeverity.Error,
    //                 DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_TYPE
    //             );
    //         }
    //     } else {
    //         diagnose(
    //             idRange.range,
    //             `Syntax error: Missing "from" property`,
    //             DiagnosticSeverity.Error,
    //             DIAGNOSTIC_CODE.OBJIDCONFIG.MISSING_PROPERTY
    //         );
    //     }
    //     if (to) {
    //         if (typeof range.to !== "number") {
    //             diagnose(
    //                 to.range,
    //                 `Syntax error: Invalid value (non-zero number expected; found ${JSON.stringify(range.to)}).`,
    //                 DiagnosticSeverity.Error,
    //                 DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_TYPE
    //             );
    //         }
    //     } else {
    //         diagnose(
    //             idRange.range,
    //             `Syntax error: Missing "to" property`,
    //             DiagnosticSeverity.Error,
    //             DIAGNOSTIC_CODE.OBJIDCONFIG.MISSING_PROPERTY
    //         );
    //     }
    // }

    // private getValidRanges(ranges: NinjaALRange[], diagnose: CreateDiagnostic, objectType?: string): NinjaALRange[] {
    //     const result = [];
    //     for (let i = 0; i < ranges.length; i++) {
    //         const range = ranges[i];
    //         if (typeof range.from === "number" && typeof range.to === "number" && range.from && range.to) {
    //             result.push(range);
    //         } else {
    //             this.reportInvalidRange(range, i, diagnose, objectType);
    //             this.showRangeWarning(range, () => UI.ranges.showInvalidRangeTypeError(range), TIME.FIVE_MINUTES);
    //         }
    //     }
    //     return result;
    // }

    // private async reportRangesOverlapDiagnostic(
    //     ordinal1: number,
    //     ordinal2: number,
    //     diagnose: CreateDiagnostic,
    //     objectType?: string
    // ) {
    //     const idRanges = await this.getIdRangesSymbol(objectType);
    //     if (!idRanges) {
    //         return;
    //     }

    //     const range1 = this._properties.idRanges(idRanges.children[ordinal1]);
    //     const range2 = this._properties.idRanges(idRanges.children[ordinal2]);

    //     diagnose(
    //         range1.range,
    //         `Invalid range: Overlaps with range ${range2.from()?.detail}..${range2.to()?.detail}`,
    //         DiagnosticSeverity.Warning,
    //         DIAGNOSTIC_CODE.OBJIDCONFIG.RANGES_OVERLAP
    //     );
    //     diagnose(
    //         range2.range,
    //         `Invalid range: Overlaps with range ${range1.from()?.detail}..${range1.to()?.detail}`,
    //         DiagnosticSeverity.Warning,
    //         DIAGNOSTIC_CODE.OBJIDCONFIG.RANGES_OVERLAP
    //     );
    // }

    // private rangesOverlap(ranges: NinjaALRange[], diagnose: CreateDiagnostic, objectType?: string): boolean {
    //     if (ranges.length <= 1) {
    //         return false;
    //     }

    //     for (let i = 0; i < ranges.length - 1; i++) {
    //         for (let j = i + 1; j < ranges.length; j++) {
    //             if (ranges[i].from <= ranges[j].to && ranges[i].to >= ranges[j].from) {
    //                 this.reportRangesOverlapDiagnostic(i, j, diagnose, objectType);
    //                 this.showRangeWarning(
    //                     ranges[i],
    //                     () => UI.ranges.showRangeOverlapError(ranges[i], ranges[j]),
    //                     TIME.TWO_MINUTES
    //                 );
    //                 return true;
    //             }
    //         }
    //     }

    //     return false;
    // }

    // private async reportToBeforeFrom(ordinal: number, diagnose: CreateDiagnostic, objectType?: string) {
    //     const idRanges = await this.getIdRangesSymbol(objectType);
    //     if (!idRanges) {
    //         return;
    //     }

    //     const range = this._properties.idRanges(idRanges.children[ordinal]);
    //     diagnose(
    //         range.range,
    //         `Invalid range: "to" must not be less than "from".`,
    //         DiagnosticSeverity.Error,
    //         DIAGNOSTIC_CODE.OBJIDCONFIG.TO_BEFORE_FROM
    //     );
    // }

    // private async reportMissingDescription(ordinal: number, diagnose: CreateDiagnostic, objectType?: string) {
    //     const idRanges = await this.getIdRangesSymbol(objectType);
    //     if (!idRanges) {
    //         return;
    //     }

    //     const range = this._properties.idRanges(idRanges.children[ordinal]);
    //     diagnose(
    //         range.range,
    //         `Missing description for range ${range.from()?.detail}..${range.to()?.detail}.`,
    //         DiagnosticSeverity.Information,
    //         DIAGNOSTIC_CODE.OBJIDCONFIG.TO_BEFORE_FROM
    //     );
    // }

    // private validateRanges(ranges: NinjaALRange[], diagnose: CreateDiagnostic, objectType?: string): NinjaALRange[] {
    //     let invalid = false;
    //     if (this.rangesOverlap(ranges, diagnose, objectType)) {
    //         invalid = true;
    //     }

    //     ranges.forEach((range, ordinal) => {
    //         if (typeof range.from !== "number" || typeof range.to !== "number" || !range.to || !range.from) {
    //             // This is a problem, but it's reported elsewhere
    //             return;
    //         }

    //         if (!range.description) {
    //             this.reportMissingDescription(ordinal, diagnose, objectType);
    //         }

    //         if (range.to < range.from) {
    //             const { from, to, description } = range;
    //             this.reportToBeforeFrom(ordinal, diagnose, objectType);
    //             this.showRangeWarning(
    //                 range,
    //                 () => UI.ranges.showInvalidRangeFromToError(range),
    //                 TIME.FIVE_MINUTES
    //             ).then(result => {
    //                 if (result === LABELS.FIX) {
    //                     // let fixed = false;
    //                     // const ranges = objectType ? this.getAllObjectRanges()[objectType] || [] : this.getIdRanges();
    //                     // for (let original of ranges) {
    //                     //     if (original.from === from && original.to === to && original.description === description) {
    //                     //         original.from = to;
    //                     //         original.to = from;
    //                     //         fixed = true;
    //                     //     }
    //                     // }
    //                     // if (fixed) {
    //                     //     if (objectType) {
    //                     //         this.setObjectRanges(objectType, ranges);
    //                     //     } else {
    //                     //         this.idRanges = ranges;
    //                     //     }
    //                     // }
    //                 }
    //             });
    //             range.from = to;
    //             range.to = from;
    //         }
    //     });

    //     // First collect valid ranges to run remaining validations
    //     const validRanges = this.getValidRanges(ranges, diagnose, objectType);

    //     // Then return either empty array or valid ranges
    //     return invalid ? [] : validRanges;
    // }

    // private async validateObjectRanges() {
    //     const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.objectRanges");
    //     const validTypes = Object.values<string>(ALObjectType);

    //     const objectRangesSymbol = await this._objectRangesPromise;
    //     if (!objectRangesSymbol) {
    //         return;
    //     }
    //     for (let child of objectRangesSymbol!.children) {
    //         const type = child.name;
    //         if (!validTypes.includes(type)) {
    //             // Report error
    //             diagnose(
    //                 child.selectionRange,
    //                 `Invalid object type: ${type}.`,
    //                 DiagnosticSeverity.Error,
    //                 DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_OBJECT_TYPE
    //             );
    //             continue;
    //         }
    //         // TODO Refactor this
    //         // this.getObjectRanges(type, diagnose);
    //     }
    // }

    // private async validateBcLicense(path: string): Promise<boolean> {
    //     if (!path) {
    //         return false;
    //     }

    //     const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.bcLicense");

    //     if (!fs.existsSync(path)) {
    //         const bcLicenseSymbol = await this._bcLicensePromise;
    //         if (bcLicenseSymbol) {
    //             diagnose(
    //                 bcLicenseSymbol?.range,
    //                 `Cannot find license file.`,
    //                 DiagnosticSeverity.Warning,
    //                 DIAGNOSTIC_CODE.OBJIDCONFIG.LICENSE_FILE_NOT_FOUND
    //             );
    //             return false;
    //         }
    //     }

    //     return true;
    // }

    // //#endregion

    //#region New validation

    private async validateIdRanges() {}

    private async validateProperties() {
        const properties = Object.values<string>(ConfigurationProperty);
        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.properties");
        const symbols = await this._symbolsPromise;
        if (!symbols) {
            return;
        }

        for (let symbol of symbols) {
            if (!properties.includes(symbol.name)) {
                diagnose(
                    symbol.selectionRange,
                    `Property "${symbol.name}" is not valid in this context`,
                    DiagnosticSeverity.Warning,
                    DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_PROPERTY
                );
            }
        }
    }

    //#endregion

    public validate() {
        this.validateProperties();
        // this.validateObjectRanges();
        // this.validateRanges();
    }
}
