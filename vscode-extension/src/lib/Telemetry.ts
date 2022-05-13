import { PropertyBag } from "./types/PropertyBag";
import { ExtensionContext } from "vscode";
import { getSha256 } from "./functions/getSha256";
import { Backend } from "./backend/Backend";
import { EXTENSION_VERSION } from "./constants";

const TELEMETRY_USER_SHA = "telemetry.userSha";
const TELEMETRY_APP_SHA = "telemetry.appSha";

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
    private _appSha: PropertyBag<string | undefined> = {};
    private _loggedOnce: PropertyBag<boolean> = {};

    private getAppShaGlobalStateKey(appId: string): string {
        return `${TELEMETRY_APP_SHA}.${appId}`;
    }

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

    private getAppSha(appId: string): string {
        if (!this._appSha[appId]) {
            this._appSha[appId] = this._context!.globalState.get<string>(this.getAppShaGlobalStateKey(appId));
        }
        if (!this._appSha[appId]) {
            const now = Date.now();
            this._context!.globalState.update(
                this.getAppShaGlobalStateKey(appId),
                (this._appSha[appId] = getSha256(`${now + Math.random() * now}.${appId}.${now}`))
            );
        }
        return this._appSha[appId]!;
    }

    public setContext(context: ExtensionContext) {
        this._context = context;
        this.log("start", undefined, EXTENSION_VERSION);
    }

    public log(event: string, appId?: string, context?: any): void {
        Backend.telemetry(appId && this.getAppSha(appId), this.userSha, event, context);
    }

    public logOnce(event: string, appId?: string, context?: any): void {
        const logKey = `${appId || ""}.${event}`;
        if (this._loggedOnce[logKey]) {
            return;
        }
        this._loggedOnce[logKey] = true;
        this.log(event, appId, context);
    }
}
