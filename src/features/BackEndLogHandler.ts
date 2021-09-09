import { window, workspace } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { Authorization } from "../lib/Authorization";
import { Backend, EventLogEntry } from "../lib/Backend";
import { PropertyBag } from "../lib/PropertyBag";
import { UI } from "../lib/UI";
import { User } from "../lib/User";

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
        for (let folder of folders) {
            let manifest = getManifest(folder.uri)!;
            this._appName[manifest.id] = manifest.name;
            let authKey = Authorization.read(folder.uri);
            promises.push(Backend.getLog(manifest.id, authKey?.key || "").then(entries => {
                if (!entries) return;
                this._pending[manifest.id] = [...(this._pending[manifest.id] || []), ...entries];
            }));
        }

        await Promise.all(promises);
    }

    private processLog() {
        if (this._disposed) return;

        for (let appId of Object.keys(this._pending)) {
            let pending = this._pending[appId];
            let log = this._log[appId];
            for (let event of pending) {
                if (event.user === User.username) continue;
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
