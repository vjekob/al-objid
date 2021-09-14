import { workspace } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { Backend } from "../lib/Backend";
import { Config } from "../lib/Config";
import { PropertyBag } from "../lib/PropertyBag";
import { UI } from "../lib/UI";
import { EventLogEntry } from "../lib/BackendTypes";

// Increasing polling interval to 2 minutes (from 15 seconds)
const POLLING_INTERVAL = 120000;

interface ConsumptionData {
    type: string;
    id: number;
}

interface TypedEntry<T> extends EventLogEntry {
    data: T;
}

export class BackEndLogHandler {
    private _timeout: NodeJS.Timeout | undefined;
    private _disposed: boolean = false;
    private _log: PropertyBag<EventLogEntry[]> = {};
    private _pending: PropertyBag<EventLogEntry[]> = {};
    private _appName: PropertyBag<string> = {};

    constructor() {
        this.initialize();
    }

    private async initialize() {
        // Collect logs and then flush them - no notifications on initial state
        await this.checkLog();
        this.flushLog();

        // Set up polling interval
        this._timeout = setInterval(async () => {
            await this.checkLog();
            this.processLog();
            this.flushLog();
        }, 15000);
    }

    private async checkLog() {
        if (this._disposed) return;

        let folders = workspace.workspaceFolders?.filter(folder => ALWorkspace.isALWorkspace(folder.uri));
        if (!folders) return;

        let promises: Promise<any>[] = [];
        let updateEntry = (id: string) => (entries: EventLogEntry[] | undefined) => {
            if (!entries) return;
            this._pending[id] = [...(this._pending[id] || []), ...entries];
        };
        for (let folder of folders) {
            let manifest = getManifest(folder.uri)!;
            this._appName[manifest.id] = manifest.name;
            let { authKey } = ObjIdConfig.instance(folder.uri);
            promises.push(Backend.getLog(manifest.id, authKey).then(updateEntry(manifest.id)));
        }

        await Promise.all(promises);
    }

    private processLog() {
        if (this._disposed) return;

        if (!Config.instance.showEventLogNotifications) return;

        for (let appId of Object.keys(this._pending)) {
            let pending = this._pending[appId];
            let log = this._log[appId];
            for (let event of pending) {
                if (event.user === Config.instance.userName) continue;
                if (log && log.find(e => e.timestamp === event.timestamp)) continue;
                switch (event.eventType) {
                    case "consumption":
                        this.processConsumption(event, appId);
                        break;
                }
            }
        }
    }

    private flushLog() {
        if (this._disposed) return;

        for (let key of Object.keys(this._pending)) {
            this._log[key] = [...(this._log[key] || []), ...(this._pending[key] || [])];
            this._pending[key] = [];
        }
    }

    private processConsumption(entry: TypedEntry<ConsumptionData>, appId: string) {
        UI.log.showObjectConsumptionInfo(entry.user, entry.data.type, entry.data.id, this._appName[appId]);
    }

    public dispose() {
        if (!this._disposed) return;
        if (this._timeout) clearTimeout(this._timeout);
        this._disposed = true;
        this._timeout = undefined;
    }
}
