import * as fs from "fs";
import * as path from "path";
import { commands, DiagnosticSeverity, DocumentSymbol, Range, SymbolKind, Uri, workspace } from "vscode";
import { CodeCommand } from "../../commands/commands";
import { BCLicense } from "../../lib/BCLicense";
import { ConfigurationProperty } from "../../lib/ObjIdConfig";
import { ALObjectType } from "../../lib/types/ALObjectType";
import { ALRange } from "../../lib/types/ALRange";
import { CreateDiagnostic, Diagnostics, DIAGNOSTIC_CODE } from "../diagnostics/Diagnostics";
import { jsonAvailable } from "./jsonAvailable";

// TODO Warn on logical ranges not covered by physical ranges

export class ObjIdConfigLinter {
    private readonly _uri: Uri;
    private readonly _symbolsPromise: Promise<DocumentSymbol[] | undefined>;
    private readonly _idRangesPromise: Promise<DocumentSymbol | undefined>;
    private readonly _objectRangesPromise: Promise<DocumentSymbol | undefined>;
    private readonly _bcLicensePromise: Promise<DocumentSymbol | undefined>;
    private readonly _authKeyPromise: Promise<DocumentSymbol | undefined>;
    private readonly _appPoolIdPromise: Promise<DocumentSymbol | undefined>;

    constructor(uri: Uri) {
        this._uri = uri;

        if (!fs.existsSync(uri.fsPath)) {
            this._symbolsPromise = Promise.resolve(undefined);
            this._idRangesPromise = Promise.resolve(undefined);
            this._objectRangesPromise = Promise.resolve(undefined);
            this._bcLicensePromise = Promise.resolve(undefined);
            this._authKeyPromise = Promise.resolve(undefined);
            this._appPoolIdPromise = Promise.resolve(undefined);
            return;
        }

        this._symbolsPromise = new Promise(async resolve => {
            if (!(await jsonAvailable)) {
                resolve(undefined);
                return;
            }

            const symbols = await (commands.executeCommand(CodeCommand.ExecuteDocumentSymbolProvider, uri) as Promise<
                DocumentSymbol[] | undefined
            >);
            resolve(symbols);
        });

        this._idRangesPromise = this.getPropertyPromise(ConfigurationProperty.Ranges);
        this._objectRangesPromise = this.getPropertyPromise(ConfigurationProperty.ObjectRanges);
        this._bcLicensePromise = this.getPropertyPromise(ConfigurationProperty.BcLicense);
        this._authKeyPromise = this.getPropertyPromise(ConfigurationProperty.AuthKey);
        this._appPoolIdPromise = this.getPropertyPromise(ConfigurationProperty.AppPoolId);
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

    private getDetailRange(symbol: DocumentSymbol): Range {
        const start = symbol.selectionRange.end.translate(0, 2);
        return new Range(start, symbol.range.end);
    }

    private normalizeRange(left: Range, right: Range) {
        return left.start.isBefore(right.end) ? new Range(left.start, right.end) : new Range(right.start, left.end);
    }

    private expectType(
        symbol: DocumentSymbol,
        expectedKind: SymbolKind,
        type: string,
        diagnose: CreateDiagnostic
    ): boolean {
        if (symbol.kind !== expectedKind) {
            diagnose(
                this.getDetailRange(symbol),
                `${type} expected`,
                DiagnosticSeverity.Error,
                DIAGNOSTIC_CODE.OBJIDCONFIG.IDRANGES_INVALID_TYPE
            );
            return false;
        }

        return true;
    }

    private makeSurePropertyIsDefined(
        property: DocumentSymbol | undefined,
        symbol: DocumentSymbol,
        name: string,
        diagnose: CreateDiagnostic
    ): boolean {
        if (!property) {
            diagnose(
                symbol.selectionRange,
                `Missing property: ${name}`,
                DiagnosticSeverity.Error,
                DIAGNOSTIC_CODE.OBJIDCONFIG.MISSING_PROPERTY
            );
            return false;
        }

        return true;
    }

    private makeSurePropertyIsValidPositiveInteger(
        value: number,
        symbol: DocumentSymbol,
        diagnose: CreateDiagnostic
    ): boolean {
        if (!value || value !== parseFloat(symbol.detail) || value < 0) {
            diagnose(
                this.getDetailRange(symbol),
                `A valid positive integer expected`,
                DiagnosticSeverity.Error,
                DIAGNOSTIC_CODE.OBJIDCONFIG.IDRANGES_INVALID_NUMBER
            );
            return false;
        }

        return true;
    }

    private async validateProperties() {
        const properties = Object.values<string>(ConfigurationProperty);
        const symbols = await this._symbolsPromise;
        if (!symbols) {
            return;
        }

        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.properties");

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

    private validateRanges(idRanges: DocumentSymbol, diagnose: CreateDiagnostic) {
        if (!this.expectType(idRanges, SymbolKind.Array, "Array", diagnose)) {
            return;
        }

        const ranges: ALRange[] = [];

        for (let symbol of idRanges.children) {
            if (!this.expectType(symbol, SymbolKind.Module, "Object", diagnose)) {
                continue;
            }

            let fromToValid = true;
            const from = symbol.children.find(child => child.name === "from");
            const to = symbol.children.find(child => child.name === "to");
            const description = symbol.children.find(child => child.name === "description");
            if (!this.makeSurePropertyIsDefined(from, symbol, "from", diagnose)) {
                fromToValid = false;
            }
            if (!this.makeSurePropertyIsDefined(to, symbol, "to", diagnose)) {
                fromToValid = false;
            }

            if (from && !this.expectType(from, SymbolKind.Number, "Number", diagnose)) {
                fromToValid = false;
            }
            if (to && !this.expectType(to, SymbolKind.Number, "Number", diagnose)) {
                fromToValid = false;
            }

            if (to && from && fromToValid) {
                fromToValid = true;
                const fromValue = parseInt(from.detail);
                const toValue = parseInt(to.detail);
                if (!this.makeSurePropertyIsValidPositiveInteger(fromValue, from, diagnose)) {
                    fromToValid = false;
                }
                if (!this.makeSurePropertyIsValidPositiveInteger(toValue, to, diagnose)) {
                    fromToValid = false;
                }

                if (fromToValid) {
                    if (toValue < fromValue) {
                        diagnose(
                            this.normalizeRange(from.range, to.range),
                            `Invalid range: "to" must not be less than "from".`,
                            DiagnosticSeverity.Error,
                            DIAGNOSTIC_CODE.OBJIDCONFIG.IDRANGES_TO_BEFORE_FROM
                        );
                        fromToValid = false;
                    }
                }

                if (fromToValid) {
                    const newRange: ALRange = { from: fromValue, to: toValue };
                    const overlapRange = ranges.find(range => range.from <= newRange.to && range.to >= newRange.from);
                    if (overlapRange) {
                        diagnose(
                            this.normalizeRange(from.range, to.range),
                            `Range overlaps with another range: ${JSON.stringify(overlapRange)}`,
                            DiagnosticSeverity.Error,
                            DIAGNOSTIC_CODE.OBJIDCONFIG.IDRANGES_OVERLAP
                        );
                    } else {
                        ranges.push(newRange);
                    }
                }
            }

            if (description) {
                this.expectType(description, SymbolKind.String, "String", diagnose);
            }
        }
    }

    private async validateIdRanges() {
        const idRanges = await this._idRangesPromise;
        if (!idRanges) {
            return;
        }

        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.idranges");
        this.validateRanges(idRanges, diagnose);
    }

    private async validateObjectTypes() {
        const objectRanges = await this._objectRangesPromise;
        if (!objectRanges) {
            return;
        }

        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.objectRanges");
        const validTypes = Object.values<string>(ALObjectType);

        if (!this.expectType(objectRanges, SymbolKind.Module, "Object", diagnose)) {
            return;
        }

        for (let child of objectRanges.children) {
            const type = child.name;
            if (!validTypes.includes(type)) {
                diagnose(
                    child.selectionRange,
                    `Invalid object type: ${type}.`,
                    DiagnosticSeverity.Error,
                    DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_OBJECT_TYPE
                );
                continue;
            }

            this.validateRanges(child, diagnose);
        }
    }

    private async validateBcLicense() {
        const bcLicense = await this._bcLicensePromise;
        if (!bcLicense) {
            return;
        }

        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.bcLicense");
        this.expectType(bcLicense, SymbolKind.String, "String", diagnose);

        const relativePath = bcLicense.detail;
        const bcLicensePath = path.isAbsolute(relativePath)
            ? relativePath
            : path.join(workspace.getWorkspaceFolder(this._uri)!.uri.fsPath, relativePath);

        if (!fs.existsSync(bcLicensePath)) {
            diagnose(
                this.getDetailRange(bcLicense),
                "License file does not exist",
                DiagnosticSeverity.Error,
                DIAGNOSTIC_CODE.OBJIDCONFIG.LICENSE_FILE_NOT_FOUND
            );
            return;
        }

        const appFolderUri = workspace.getWorkspaceFolder(this._uri)!.uri;
        const license = new BCLicense(bcLicensePath, appFolderUri);
        if (!license.isValid) {
            diagnose(
                this.getDetailRange(bcLicense),
                "Invalid license file",
                DiagnosticSeverity.Error,
                DIAGNOSTIC_CODE.OBJIDCONFIG.LICENSE_FILE_INVALID
            );
        }
    }

    private async validateAuthKey() {
        const authKey = await this._authKeyPromise;
        if (!authKey) {
            return;
        }

        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.authKey");
        this.expectType(authKey, SymbolKind.String, "String", diagnose);
    }

    private async validateAppPoolId() {
        const appPoolId = await this._appPoolIdPromise;
        if (!appPoolId) {
            return;
        }

        const diagnose = Diagnostics.instance.createDiagnostics(this._uri, "objidconfig.appPoolId");
        this.expectType(appPoolId, SymbolKind.String, "String", diagnose);
    }

    //#endregion

    public validate() {
        Diagnostics.instance.resetForUri(this._uri);
        this.validateProperties();
        this.validateIdRanges();
        this.validateObjectTypes();
        this.validateBcLicense();
        this.validateAuthKey();
        this.validateAppPoolId();
    }
}
