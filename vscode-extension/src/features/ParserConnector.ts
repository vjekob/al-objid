import { Disposable, Position, Uri } from "vscode";
import { ALParserNinja } from "@vjeko.com/al-parser-ninja";
import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { LogLevel, output } from "./Output";
import { CheckType } from "@vjeko.com/al-parser-ninja/dist/CheckType";
import { ALRange } from "../lib/types/ALRange";

export interface NextIdContext {
    injectSemicolon: boolean;
    requireId?: number;
    additional?: {
        ordinal: number;
        range: ALRange;
    };
}

export class ParserConnector implements Disposable {
    private _initialized: boolean = false;
    private _initialization: Promise<void>;

    private get initialization(): Promise<void> {
        if (!this._initialized) {
            output.log("[AL Parser] Waiting for parser initialization to complete", LogLevel.Verbose);
        }
        return this._initialization;
    }

    public async parse(uris: Uri[]): Promise<ALObject[]> {
        output.log(`[AL Parser] Parsing ${uris.length} file(s)`);
        await this.initialization;
        const files = uris.map(uri => uri.fsPath);
        const objects = await ALParserNinja.parse(files);
        objects
            .filter(o => o.error)
            .forEach(o =>
                output.log(`[AL Parser] Error parsing ${o.name} (${o.path}): ${(o as any).error}`, LogLevel.Info)
            );
        return objects;
    }

    public async checkField(
        code: string,
        position: Position,
        symbols: string[],
        context: NextIdContext
    ): Promise<boolean> {
        output.log("[AL Parser] Checking if field ID is expected at current position");
        await this.initialization;
        const { line, character } = position;
        const response = await ALParserNinja.check(CheckType.field, code, { line, character }, symbols);
        if (!response.valid) {
            return false;
        }
        context.injectSemicolon = !response.semiColon;
        return true;
    }

    public async checkValue(
        code: string,
        position: Position,
        symbols: string[],
        context: NextIdContext
    ): Promise<boolean> {
        output.log("[AL Parser] Checking if enum value ID is expected at current position");
        await this.initialization;
        const { line, character } = position;
        const response = await ALParserNinja.check(CheckType.value, code, { line, character }, symbols);
        if (!response.valid) {
            return false;
        }
        context.injectSemicolon = !response.semiColon;
        return true;
    }

    //#region Singleton
    private static _instance: ParserConnector;

    private constructor() {
        output.log("[AL Parser] Initializing parser...", LogLevel.Verbose);
        this._initialization = ALParserNinja.initialize();
        ALParserNinja.on("error", (e: Error) => output.log(`[AL Parser] Parser error ${e.message}`, LogLevel.Info));
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
