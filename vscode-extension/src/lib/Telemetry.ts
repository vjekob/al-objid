import { PropertyBag } from "./types/PropertyBag";
import { ExtensionContext, version } from "vscode";
import { getSha256 } from "./functions/getSha256";
import { Backend } from "./backend/Backend";
import { EXTENSION_VERSION } from "./constants";
import { ALApp } from "./ALApp";
import { Config } from "./Config";
import { NinjaCommand } from "../commands/commands";

const TELEMETRY_USER_SHA = "alninja.telemetry.userSha";

export enum TelemetryEventType {
    Start = "start",
    InvalidBackEndConfig = "invalidBackEndConfig",
    Command = "command",
    NextId = "nextId",
    LearnMore = "learn",
    ReleaseNotes = "releaseNotes",
    ObjIdConfigDeleted = "objIdConfigDeleted",
    ShowDocument = "showDocument",
    TreeView = "treeView",
    FeatureInUse = "feature",
}

export class Telemetry {
    //#region Singleton
    private static _instance: Telemetry;

    private constructor() {}

    public static get instance(): Telemetry {
        return this._instance || (this._instance = new Telemetry());
    }
    //#endregion

    private _context?: ExtensionContext;
    private _userSha?: string;
    private _loggedOnce: PropertyBag<boolean> = {};

    private get userSha(): string {
        if (!this._userSha) {
            this._userSha = this._context!.globalState.get<string>(TELEMETRY_USER_SHA);
        }
        if (!this._userSha) {
            const now = Date.now();
            this._context!.globalState.update(
                TELEMETRY_USER_SHA,
                (this._userSha = getSha256(`${now + Math.random() * now}.${now}`))
            );
        }
        return this._userSha;
    }

    public setContext(context: ExtensionContext) {
        this._context = context;
        this.log(TelemetryEventType.Start, undefined, {
            ninja: EXTENSION_VERSION,
            vscode: version,
            ownEndpoints: !Config.instance.isDefaultBackEndConfiguration,
        });
    }

    public log(event: TelemetryEventType, app?: ALApp, context?: any): void {
        Backend.telemetry(app?.hash, this.userSha, event, context);
    }

    public logAppCommand(app: ALApp, command: NinjaCommand, context: {} = {}): void {
        Backend.telemetry(app.hash, this.userSha, TelemetryEventType.Command, { command, ...context });
    }

    public logCommand(command: NinjaCommand, context: {} = {}): void {
        Backend.telemetry(undefined, this.userSha, TelemetryEventType.Command, { command, ...context });
    }

    public logNextNo(app: ALApp, type: string, commit: boolean, conflictPrevented?: boolean) {
        Backend.telemetry(app.hash, this.userSha, TelemetryEventType.NextId, { type, commit, conflictPrevented });
    }

    public logLearnMore(document: string) {
        Backend.telemetry(undefined, this.userSha, TelemetryEventType.LearnMore, { document });
    }

    public logOncePerSession(event: TelemetryEventType, app?: ALApp, context?: any): void {
        const logKey = `${app?.hash || ""}.${event}`;
        if (this._loggedOnce[logKey]) {
            return;
        }
        this._loggedOnce[logKey] = true;
        this.log(event, app, context);
    }

    public logOnceAndNeverAgain(event: TelemetryEventType, app?: ALApp, context?: any): void {
        const logId = `user:${this.userSha}${app ? `.app:${app.hash}` : ""}.${event}:${JSON.stringify(context)}`;
        // if (this._context!.globalState.get<boolean>(logId)) {
        //     return;
        // }
        // this._context!.globalState.update(logId, true);
        this.log(event, app, context);
    }
}
