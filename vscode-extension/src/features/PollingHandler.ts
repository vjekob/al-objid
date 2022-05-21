import { NotificationsFromLog } from "./NotificationsFromLog";
import { Disposable } from "vscode";
import { Backend } from "../lib/backend/Backend";
import { PropertyBag } from "../lib/types/PropertyBag";
import { FolderAuthorization } from "../lib/backend/FolderAuthorization";
import { ConsumptionCache } from "./ConsumptionCache";
import { NewsHandler } from "./NewsHandler";
import { output } from "./Output";
import { WorkspaceManager } from "./WorkspaceManager";

const DEFAULT_POLLING_INTERVAL = 15 * 1000; // 15 seconds
const MAX_POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes

export class PollingHandler implements Disposable {
    private _timeout: NodeJS.Timeout | undefined;
    private _disposed: boolean = false;
    private _appName: PropertyBag<string> = {};
    private _pollingInterval: number = DEFAULT_POLLING_INTERVAL;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        await this.check();
        this.scheduleNext();
    }

    private async check() {
        if (this._disposed) {
            return;
        }

        let alApps = WorkspaceManager.instance.alApps;
        if (alApps.length === 0) {
            return;
        }

        let payload: FolderAuthorization[] = [];
        for (let app of alApps) {
            this._appName[app.hash] = app.manifest.name;
            let { authKey } = app.config;
            payload.push({ appId: app.hash, authKey });
        }

        let updates = await Backend.check(payload);
        if (!updates) {
            this.backOff();
            return;
        }

        const { _news, ...apps } = updates;

        let anyUpdates = NewsHandler.instance.updateNews(_news);
        let consumptionUpdates = false;
        for (let appId of Object.keys(apps)) {
            const { _log, _ranges, ...consumptions } = apps[appId];
            if (ConsumptionCache.instance.updateConsumption(appId, consumptions)) {
                anyUpdates = true;
                consumptionUpdates = true;
            }
            if (NotificationsFromLog.instance.updateLog(appId, _log, this._appName[appId])) {
                anyUpdates = true;
            }
        }

        if (!anyUpdates) {
            this.backOff();
        } else {
            this._pollingInterval = DEFAULT_POLLING_INTERVAL;
        }
    }

    private backOff() {
        this._pollingInterval *= 1.25;

        // Make sure it's never shorter than minimum
        if (this._pollingInterval < DEFAULT_POLLING_INTERVAL) {
            this._pollingInterval = DEFAULT_POLLING_INTERVAL;
        }
        if (this._pollingInterval > MAX_POLLING_INTERVAL) {
            this._pollingInterval = MAX_POLLING_INTERVAL;
        }
    }

    private scheduleNext() {
        this._timeout = setTimeout(async () => {
            try {
                await this.check();
            } catch (e: any) {
                output.log(`An error occurred while executing polling check handler: ${e?.message || e}`);
            }

            this.scheduleNext();
        }, this._pollingInterval);
    }

    public dispose() {
        if (!this._disposed) return;
        if (this._timeout) clearTimeout(this._timeout);
        this._disposed = true;
        this._timeout = undefined;
    }
}
