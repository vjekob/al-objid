import { Blob } from "@vjeko.com/azure-blob";
import { AzureHttpHandler, createEndpoint, validate, optional } from "../../../http";
import { arrayOrEntity } from "../../../http/validators";
import { ErrorResponse } from "../../../http/ErrorResponse";
import { HttpStatusCode } from "../../../http/HttpStatusCode";
import { AppInfo, LogEntry } from "../../../types";
import { AppCache } from "../../../cache";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

interface CheckRequestEntry {
    appId: string;
    authKey?: string;
}

type CheckResponseEntry = Omit<AppInfo, "_authorization"> & { _log?: LogEntry[] };

type CheckResponse = {
    [key: string]: CheckResponseEntry;
};

/**
 * Checks if the request is authorized for the given app.
 * Authorization passes if:
 * - App doesn't exist (returns empty object for the app)
 * - App has no authorization key configured
 * - The provided authKey matches the stored key
 */
function isAuthorized(app: AppInfo | null, authKey: string | undefined): boolean {
    if (!app?._authorization?.key) {
        return true;
    }
    return app._authorization.key === authKey;
}

/**
 * Strips authorization info from app data for response.
 */
function stripAuthorization(app: AppInfo | null): Omit<AppInfo, "_authorization"> {
    if (!app) {
        return {} as Omit<AppInfo, "_authorization">;
    }
    const { _authorization, ...rest } = app;
    return rest;
}

/**
 * Gets app info from cache or blob storage.
 * Populates cache on miss.
 */
async function getAppWithCache(appId: string): Promise<AppInfo | null> {
    const cached = AppCache.get(appId);
    if (cached !== undefined) {
        return cached;
    }

    const blob = new Blob<AppInfo>(`apps://${appId}.json`);
    const app = await blob.read();

    if (app) {
        AppCache.set(appId, app);
    }

    return app;
}

/**
 * Filters logs to only include entries from the last 2 hours.
 */
function filterRecentLogs(logs: LogEntry[]): LogEntry[] {
    const cutoff = Date.now() - TWO_HOURS_MS;
    return logs.filter(entry => entry.timestamp >= cutoff);
}

// POST - Check apps and return their consumption data
// Accepts single entry or array of entries
// Filters out unauthorized apps (returns 401 only for single unauthorized request)
const post: AzureHttpHandler<CheckRequestEntry | CheckRequestEntry[], CheckResponse> = async (req) => {
    const entries = Array.isArray(req.body) ? req.body : [req.body];
    const isSingleRequest = !Array.isArray(req.body);

    // Process each entry and filter to authorized ones
    const authorizedEntries: { entry: CheckRequestEntry; app: AppInfo | null }[] = [];

    for (const entry of entries) {
        const app = await getAppWithCache(entry.appId);

        if (isAuthorized(app, entry.authKey)) {
            authorizedEntries.push({ entry, app });
        }
    }

    // If single request and not authorized, return 401
    if (isSingleRequest && authorizedEntries.length === 0) {
        throw new ErrorResponse("Invalid authorization key", HttpStatusCode.ClientError_401_Unauthorized);
    }

    // Build response with stripped app info and filtered logs
    const result: CheckResponse = {};
    for (const { entry, app } of authorizedEntries) {
        const logs = await AppCache.getLogs(entry.appId);
        const recentLogs = filterRecentLogs(logs);

        const appData = stripAuthorization(app) as CheckResponseEntry;
        appData._log = recentLogs;
        result[entry.appId] = appData;
    }

    return result;
};

validate(post, arrayOrEntity({
    appId: "string",
    authKey: optional("string"),
}));

export const check = createEndpoint({
    moniker: "v3-check",
    route: "v3/check",
    POST: post,
});

