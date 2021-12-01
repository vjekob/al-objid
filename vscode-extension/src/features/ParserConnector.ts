import { Disposable, Uri } from "vscode";
import { ALParserNinja } from "@vjeko.com/al-parser-ninja";
import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { LogLevel, output } from "./Output";

export class ParserConnector implements Disposable {
    private _initialized: boolean = false;
    private _initialization: Promise<void>;

    public async parse(uris: Uri[]): Promise<ALObject[]> {
        output.log(`[AL Parser] Parsing ${uris.length} file(s)`);
        if (!this._initialized) {
            output.log("[AL Parser] Waiting for parser initialization to complete", LogLevel.Verbose);
        }
        await this._initialization;
        const files = uris.map(uri => uri.fsPath);
        const objects = await ALParserNinja.parse(files);
        return objects;
    }

    //#region Singleton
    private static _instance: ParserConnector;

    private constructor() {
        output.log("[AL Parser] Initializing parser...", LogLevel.Verbose);
        this._initialization = ALParserNinja.initialize();
        this._initialization.then(() => {
            output.log("[AL Parser] Parser is now initialized.", LogLevel.Verbose);
            this._initialized = true;
        });
    }

    public static get instance(): ParserConnector {
        return this._instance || (this._instance = new ParserConnector());
    }
    //#endregion

    //#region Disposable
    private _disposed: boolean = false;

    public async dispose(): Promise<void> {
        if (this._disposed) {
            return;
        }

        this._disposed = true;
        await ALParserNinja.terminate();
    }
    //#endregion
}
