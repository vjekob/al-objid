import { EventLogEntry } from "../lib/BackendTypes";
import { Config } from "../lib/Config";
import { decrypt } from "../lib/Encryption";
import { UI } from "../lib/UI";

export class NotificationsFromLog {
    //#region Singleton
    private static _instance: NotificationsFromLog;

    private constructor() {}

    public static get instance(): NotificationsFromLog {
        return this._instance || (this._instance = new NotificationsFromLog());
    }
    //#endregion

    private _log: { [key: string]: number } = {};

    public updateLog(appId: string, log: EventLogEntry[] = [], appName: string): boolean {
        const lastTimestamp = this._log[appId];
        if (!lastTimestamp) {
            // On the first call, no notifications should be shown
            this._log[appId] = Date.now();
            return true;
        }

        if (!Config.instance.showEventLogNotifications) {
            return false;
        }

        let updated = false;
        let maxTimestamp = 0;
        for (let event of log) {
            if (event.timestamp <= lastTimestamp) {
                continue;
            }

            if (event.timestamp > maxTimestamp) {
                maxTimestamp = event.timestamp;
            }

            if (event.user) {
                event.user = decrypt(event.user, appId) || "Unknown user";
                if (event.user === Config.instance.userName) {
                    continue;
                }

                UI.log.showMessage(event, appName);
                updated = true;
            }
        }

        this._log[appId] = maxTimestamp || Date.now();

        return updated;
    }
}
