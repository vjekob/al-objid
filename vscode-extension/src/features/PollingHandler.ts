import { NotificationsFromLog } from './NotificationsFromLog';
import { Disposable, workspace } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { Backend } from "../lib/Backend";
import { PropertyBag } from "../lib/PropertyBag";
import { FolderAuthorization } from "../lib/BackendTypes";
import { ConsumptionCache } from "./ConsumptionCache";
import { NewsHandler } from './NewsHandler';
import { output } from './Output';
import { ExplorerTreeDataProvider } from './Explorer/ExplorerTreeDataProvider';

const POLLING_INTERVAL = 5 * 1000; // 30 seconds
const MAX_POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes

export class PollingHandler implements Disposable {
    private _timeout: NodeJS.Timeout | undefined;
    private _disposed: boolean = false;
    private _appName: PropertyBag<string> = {};
    private _pollingInterval: number = POLLING_INTERVAL;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        await this.check();
        this.scheduleNext();
    }

    private async check() {
        if (this._disposed) return;

        let folders = workspace.workspaceFolders?.filter(folder => ALWorkspace.isALWorkspace(folder.uri));
        if (!folders) return;

        let payload: FolderAuthorization[] = [];
        for (let folder of folders) {
            let manifest = getManifest(folder.uri)!;
            this._appName[manifest.id] = manifest.name;
            let { authKey } = ObjIdConfig.instance(folder.uri);
            payload.push({ appId: manifest.id, authKey });
        }

        let updates = await Backend.check(payload);
        if (!updates) return;

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
        }
        
        if (consumptionUpdates) {
            ExplorerTreeDataProvider.instance.refresh();
        }
    }

    // TODO This must not be automatic, but should attempt to follow some historic update rates (e.g. polling every 1 minute during work hours, every 120 minutes in off-hours)
    private backOff() {
        this._pollingInterval *= 1.25;
        if (this._pollingInterval > MAX_POLLING_INTERVAL) {
            this._pollingInterval = MAX_POLLING_INTERVAL;
        }
    }

    private scheduleNext() {
        this._timeout = setTimeout(async () => {
            try {
                await this.check();
            }
            catch (e: any) {
                output.log(`An error occurred while executing polling check handler: ${e?.message || e}`)
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
