import { NotificationsFromLog } from './../features/NotificationsFromLog';
import { HttpStatusHandler } from "../features/HttpStatusHandler";
import { output } from "../features/Output";
import { AuthorizationDeletedInfo, AuthorizationInfo, AuthorizedAppConsumption, ConsumptionInfo, ConsumptionInfoWithTotal, FolderAuthorization, CheckResponse, NextObjectIdInfo, EventLogEntry, ConsumptionData, AuthorizedAppResponse } from "./BackendTypes";
import { Config } from "./Config";
import { decrypt, encrypt } from "./Encryption";
import { HttpMethod, Https } from "./Https";
import { executeWithStopwatchAsync } from "./MeasureTime";
import { UI } from "./UI";
import { ConsumptionCache } from '../features/ConsumptionCache';
import { getLastKnownAppName } from './AppManifest';
import { ExplorerTreeDataProvider } from '../features/Explorer/ExplorerTreeDataProvider';
import { LABELS } from './constants';
import { env, Uri } from 'vscode';
import { Telemetry } from './Telemetry';

type ErrorHandler<T> = (response: HttpResponse<T>, request: HttpRequest) => Promise<boolean>;

interface HttpRequest {
    hostname: string,
    path: string,
    method: string,
    data: any
}

interface HttpResponse<T> {
    error: any,
    status: symbol,
    value?: T,
}

const TELEMETRY_HOST_NAME = "alninja-telemetry.azurewebsites.net";

export const API_RESULT = {
    NOT_SENT: Symbol("NOT_SENT"),
    SUCCESS: Symbol("SUCCESS"),
    ERROR_HANDLED: Symbol("ERROR_HANDLED"),
    ERROR_NOT_HANDLED: Symbol("ERROR_NOT_HANDLED"),
}

interface Endpoint {
    hostname: string;
    key?: string;
}

class Endpoints {
    static get default(): Endpoint {
        return {
            hostname: Config.instance.backEndUrl,
            key: Config.instance.backEndAPIKey
        };
    }

    static get polling(): Endpoint {
        return {
            hostname: Config.instance.backEndUrlPoll,
            key: Config.instance.backEndAPIKeyPoll
        };
    }

    static get telemetry(): Endpoint {
        return {
            hostname: TELEMETRY_HOST_NAME,
        }
    }
}

(async () => {
    if (Config.instance.isBackEndConfigInError) {
        if (await UI.general.showBackEndConfigurationError() === LABELS.BUTTON_LEARN_MORE) {
            env.openExternal(Uri.parse("https://github.com/vjekob/al-objid/blob/master/doc/DeployingBackEnd.md"));
        }
    }
})();

/**
* Sends a request to the back-end API.
* 
* @param path Back-end endpoint
* @param method HTTP method
* @param data Data to send to the back-end endpoint
* @param errorHandler Error handler to execute in case of unsuccessful request
* @template T Type of response object expected from the back end
* @returns `HttpResponse` object that contains full information about response, error, and error handling status
*/
async function sendRequest<T>(path: string, method: HttpMethod, data: any = {}, errorHandler?: ErrorHandler<T>, endpoint: Endpoint = Endpoints.default): Promise<HttpResponse<T>> {
    const { hostname, key } = endpoint;
    const headers: any = {
        "Content-Type": "application/json",
    };
    if (key) {
        headers["X-Functions-Key"] = key;
    }

    const https = new Https({
        hostname,
        path,
        headers
    });

    if (Config.instance.useVerboseOutputLogging) {
        let { authKey, ...log } = data;
        output.log(`[Verbose] sending request to https://${hostname}${path}: ${JSON.stringify(log)}`);
    }

    const request: HttpRequest = { hostname, path, method, data };
    const response: HttpResponse<T> = {
        error: null,
        status: API_RESULT.NOT_SENT,
    };

    if (data && typeof data === "object" && !Array.isArray(data) && data.appId) {
        data.user = encrypt(Config.instance.userName, data.appId);
    }

    return await executeWithStopwatchAsync(async () => {
        try {
            response.value = await https.send<T>(method, data);
            response.status = API_RESULT.SUCCESS;

            const appInfo = (response.value as any)?._appInfo;
            if (appInfo) {
                const { appId } = data;
                const { _log, ...consumptions } = appInfo;
                NotificationsFromLog.instance.updateLog(appId, _log as EventLogEntry[], getLastKnownAppName(appId));
                if (ConsumptionCache.instance.updateConsumption(appId, consumptions as ConsumptionData)) {
                    ExplorerTreeDataProvider.instance.refresh();
                }
            }
        } catch (error: any) {
            if (preprocessStatusError(error)) {
                response.error = error;
                response.status = API_RESULT.ERROR_HANDLED;
                return response;
            }
            output.log(`Sending ${method} request to ${path} endpoint resulted in an error: ${JSON.stringify(error)}`);
            response.error = error;
            response.status = API_RESULT.ERROR_NOT_HANDLED;
            if (!errorHandler || !(await errorHandler(response, request))) handleErrorDefault(response, request);
        }
        return response;
    }, `Sending ${method} request to ${path} endpoint`);
}

function preprocessStatusError(error: any): boolean {
    if (typeof error === "object" && error) {
        switch (error.statusCode) {
            case 410:
                HttpStatusHandler.instance.handleError410(error.error || "");
                return true;
            case 503:
                HttpStatusHandler.instance.handleError503(error);
                return true;
        }
    }

    return false;
}

function handleErrorDefault<T>(response: HttpResponse<T>, request: HttpRequest): void {
    const { error } = response;
    const { hostname } = request;
    if (error.error && error.error.code === "ENOTFOUND") {
        UI.backend.showEndpointNotFoundError(hostname, Config.instance.isDefaultBackEndConfiguration);
    }
    if (error.statusCode) {
        switch (error.statusCode) {
            case 401:
                UI.backend.showEndpointUnauthorizedError(Config.instance.isDefaultBackEndConfiguration);
        }
    }
}

const knownManagedApps: { [key: string]: Promise<boolean> | undefined } = {};

async function isKnownManagedApp(appId: string, forceCheck: boolean = false): Promise<boolean> {
    if (!knownManagedApps[appId]) {
        if (!forceCheck) {
            return false;
        }
        return await (knownManagedApps[appId] = Backend.checkApp(appId));
    }

    return await knownManagedApps[appId]!;
}

export class Backend {
    static async getNextNo(appId: string, type: string, ranges: any, commit: boolean, authKey: string, require?: number): Promise<NextObjectIdInfo | undefined> {
        if (!await isKnownManagedApp(appId)) {
            if (!commit) {
                knownManagedApps[appId] = Promise.resolve(true);
            }
        }

        const additionalOptions = {} as NextObjectIdInfo;
        if (Config.instance.requestPerRange) {
            additionalOptions.perRange = true;
            if (commit && require) {
                additionalOptions.require = require;
            }
        }

        const response = await sendRequest<NextObjectIdInfo>(
            "/api/v2/getNext",
            commit ? "POST" : "GET",
            {
                appId,
                type,
                ranges,
                authKey,
                ...additionalOptions
            }
        );
        if (response.status === API_RESULT.SUCCESS) output.log(`Received next ${type} ID response: ${JSON.stringify(response.value)}`);
        return response.value;
    }

    static async syncIds(appId: string, ids: ConsumptionInfo, patch: boolean, authKey: string): Promise<boolean> {
        knownManagedApps[appId] = Promise.resolve(true);

        const response = await sendRequest<ConsumptionInfo>(
            "/api/v2/syncIds",
            patch ? "PATCH" : "POST",
            { appId, ids, authKey }
        );
        return !!response.value;
    }

    static async autoSyncIds(consumptions: AuthorizedAppConsumption[], patch: boolean): Promise<boolean> {
        for (let app of consumptions) {
            knownManagedApps[app.appId] = Promise.resolve(true);
        }
        const response = await sendRequest<ConsumptionInfo>(
            "/api/v2/autoSyncIds",
            patch ? "PATCH" : "POST",
            { appFolders: consumptions }
        );
        return !!response.value;
    }

    static async authorizeApp(appId: string, gitUser: string, gitEMail: string, errorHandler: ErrorHandler<AuthorizationInfo>): Promise<AuthorizationInfo | undefined> {
        knownManagedApps[appId] = Promise.resolve(true);
        const response = await sendRequest<AuthorizationInfo>(
            "/api/v2/authorizeApp",
            "POST",
            {
                appId,
                gitUser: encrypt(gitUser, appId),
                gitEMail: encrypt(gitEMail, appId),
            },
            errorHandler
        );
        return response.value;
    }

    static async getAuthInfo(appId: string, authKey: string): Promise<AuthorizedAppResponse | undefined> {
        // If the app is known to not be managed by the back end, then we exit
        if (!await isKnownManagedApp(appId, true)) {
            return;
        }

        const response = await sendRequest<AuthorizedAppResponse>(
            "/api/v2/authorizeApp",
            "GET",
            { appId, authKey },
        );
        const result = response.value;
        if (result && result.user) {
            result.user.name = decrypt(result.user.name, appId) || "";
            result.user.email = decrypt(result.user.email, appId) || "";
        }
        return result;
    }

    static async deauthorizeApp(appId: string, authKey: string, errorHandler: ErrorHandler<AuthorizationDeletedInfo>): Promise<boolean> {
        const response = await sendRequest<AuthorizationDeletedInfo>(
            "/api/v2/authorizeApp",
            "DELETE",
            { appId, authKey },
            errorHandler
        );
        return typeof response.value === "object" && response.value.deleted;
    }

    static async check(payload: FolderAuthorization[]): Promise<CheckResponse | undefined> {
        // We are not calling the polling endpoint if it's misconfigured. Either both URLs are default, or polling is pointless.
        if (Config.instance.isBackEndConfigInError) {
            Telemetry.instance.logOnce("invalidBackendConfig");
            return;
        }

        // Are app IDs known?
        const actualPayload: FolderAuthorization[] = [];
        const promises: Promise<boolean>[] = [];
        for (let folder of payload) {
            let knownApp = knownManagedApps[folder.appId];
            if (knownApp) {
                if (await knownApp) {
                    actualPayload.push(folder);
                }
                continue;
            }

            promises.push(((appFolder: FolderAuthorization) => {
                const checkApp = isKnownManagedApp(appFolder.appId, true);
                checkApp.then(result => result && actualPayload.push(appFolder));
                return checkApp;
            })(folder));
        }

        // Let's await on any pending promises
        await Promise.all(promises);

        // If we have no apps to check, we exit
        if (actualPayload.length === 0) {
            return;
        }

        // We check only those apps that we know are managed by the back end
        const response = await sendRequest<CheckResponse>(
            "/api/v2/check",
            "GET",
            actualPayload,
            async () => true, // On error, do nothing (message is logged in the output already)
            Endpoints.polling
        );
        return response.value;
    }

    static async getConsumption(appId: string, authKey: string): Promise<ConsumptionInfoWithTotal | undefined> {
        if (!await isKnownManagedApp(appId)) {
            return;
        }

        const response = await sendRequest<ConsumptionInfoWithTotal>(
            "/api/v2/getConsumption",
            "GET",
            { appId, authKey },
        );
        return response.value;
    }

    static async checkApp(appId: string): Promise<boolean> {
        const response = await sendRequest<boolean>(
            "/api/v2/checkApp",
            "GET",
            { appId },
        );
        return response.value ?? false;
    }

    static async telemetry(appSha: string | undefined, userSha: string, event: string, context?: any) {
        if (appSha && !await isKnownManagedApp(appSha)) {
            // No telemetry is logged for non-managed apps
            return;
        }

        sendRequest<undefined>(
            "/api/telemetry",
            "POST",
            {
                ownEndpoints: !Config.instance.isDefaultBackEndConfiguration,
                userSha,
                appSha,
                event,
                context,
            },
            async () => true,
            Endpoints.telemetry
        );
    }
}
