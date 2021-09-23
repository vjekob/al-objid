import { EventLogEntry } from "./EventLogEntry";

/**
 * IMPORTANT!
 * 
 * The purpose of this in-memory cache is to keep information about changes to the back-end app state
 * (consumption of object IDs, authorization, deauthorization, etc.) and to feed that cach to `getLog`
 * request. The `getLog` endpoint is polled every 15 seconds by the front end and is used to pull
 * information about notifications that should be shown to the user.
 * 
 * If there are multiple instances of the Function App running, then it is possible that the users in
 * the front end do not receive notifications described above, if (and only if) the Function App instance
 * that processed the change is not the same instance that responds to the `getLog` request.
 * 
 * Since notifications are a non-essential feature, this behavior is acceptable.
 * 
 * Notifications will be changed in near future and will be switched from pull based on polling interva
 * to push using a push notifications technology. Until then, notifications have this known issue.
 */

// Keep log entries cached for 1 hour
const LOG_CACHE_DURATION = 3600000;

interface UserContent {
    user: string;
}

class AppLogCache {
    private _entries: EventLogEntry[] = [];

    private cleanUp(): void {
        const now = Date.now();
        this._entries = this._entries.filter(entry => now - entry.timestamp < LOG_CACHE_DURATION);
    }

    public store(entry: EventLogEntry): void {
        this.cleanUp();
        this._entries.push(entry);
    }

    public read(): EventLogEntry[] {
        this.cleanUp();
        return this._entries;
    }
}

interface LogCache {
    [key: string]: AppLogCache;
}

const cache: LogCache = {};

export class Log {
    private static logEvent(appId: string, eventType: string, user: string, data: any) {
        if (!cache[appId]) {
            cache[appId] = new AppLogCache();
        }
        const log = cache[appId];
        const timestamp = Date.now();
        log.store({ timestamp, eventType, user, data });
    }

    public static logConsumption(appId: string, type: string, id: number, content: UserContent): void {
        this.logEvent(appId, "consumption", content.user, { type, id });
    }

    public static read(appId: string): EventLogEntry[] {
        const log = cache[appId];
        return log?.read() || [];
    }
};
