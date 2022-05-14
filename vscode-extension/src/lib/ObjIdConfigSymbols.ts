import { commands, DocumentSymbol, Uri } from "vscode";
import * as fs from "fs";
import path = require("path");
import * as os from "os";
import { getSha256 } from "./functions/getSha256";
import { ConfigurationProperty } from "./ObjIdConfig";
import { CodeCommand } from "../commands/commands";

async function waitForJsonActivation(): Promise<boolean> {
    // We need this because there is no other reliable way to await for activation of JSON language features, needed for symbol loading
    // Check this: https://github.com/microsoft/vscode/issues/100660
    const tempFile = path.join(os.tmpdir(), `ninja${getSha256(`${Date.now()}`)}.json`);
    if (!fs.existsSync(tempFile)) {
        fs.writeFileSync(tempFile, JSON.stringify({ ninja: "rocks" }));
    }
    const tempUri = Uri.file(tempFile);

    // Allow 60 seconds grace period to load JSON language features
    const start = Date.now();
    let interval = 100;
    let available = false;
    while (Date.now() < start + 60000) {
        available = await new Promise<boolean>(resolve => {
            setTimeout(async () => {
                const symbols = await commands.executeCommand(CodeCommand.ExecuteDocumentSymbolProvider, tempUri);
                if (symbols) {
                    resolve(true);
                }
                interval += 500;
                resolve(false);
            }, interval);
        });
        if (available) {
            break;
        }
    }

    fs.unlinkSync(tempFile);

    return available;
}

let jsonAvailable = waitForJsonActivation();

export class ObjIdConfigSymbols {
    private readonly _symbolsPromise: Promise<DocumentSymbol[] | undefined>;
    private readonly _idRangesPromise: Promise<DocumentSymbol | undefined>;
    private readonly _objectRangesPromise: Promise<DocumentSymbol | undefined>;
    private readonly _bcLicensePromise: Promise<DocumentSymbol | undefined>;

    constructor(uri: Uri) {
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

            const symbols = await (commands.executeCommand(CodeCommand.ExecuteDocumentSymbolProvider, uri) as Promise<
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

    public get symbols(): Promise<DocumentSymbol[] | undefined> {
        return this._symbolsPromise;
    }

    public get idRanges(): Promise<DocumentSymbol | undefined> {
        return this._idRangesPromise;
    }

    public get objectRanges(): Promise<DocumentSymbol | undefined> {
        return this._objectRangesPromise;
    }

    public get bcLicense(): Promise<DocumentSymbol | undefined> {
        return this._bcLicensePromise;
    }

    public properties = {
        idRanges: (range: DocumentSymbol) => ({
            ...range,
            from: () => range.children.find(child => child.name === "from"),
            to: () => range.children.find(child => child.name === "to"),
        }),
    };
}
