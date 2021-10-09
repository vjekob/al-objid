import { HttpStatusHandler } from "../features/HttpStatusHandler";
import { output } from "../features/Output";
import { AuthorizationDeletedInfo, AuthorizationInfo, AuthorizedAppConsumption, ConsumptionInfo, ConsumptionInfoWithTotal, FolderAuthorization, FolderEventLogEntries, NewsEntry, NewsResponse, NextObjectIdInfo } from "./BackendTypes";
import { Config } from "./Config";
import { HttpMethod, Https } from "./Https";
import { executeWithStopwatchAsync } from "./MeasureTime";
import { UI } from "./UI";

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

const DEFAULT_HOST_NAME = "vjekocom-alext-weu.azurewebsites.net";
const NEWS_HOST_NAME = "vjekocom-alext-weu.azurewebsites.net";

export const API_RESULT = {
    NOT_SENT: Symbol("NOT_SENT"),
    SUCCESS: Symbol("SUCCESS"),
    ERROR_HANDLED: Symbol("ERROR_HANDLED"),
    ERROR_NOT_HANDLED: Symbol("ERROR_NOT_HANDLED"),
}

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
async function sendRequest<T>(path: string, method: HttpMethod, data: any = {}, errorHandler?: ErrorHandler<T>, hostname: string = Config.instance.backEndUrl || DEFAULT_HOST_NAME): Promise<HttpResponse<T>> {
    const key = Config.instance.backEndAPIKey;
    const https = new Https({
        hostname,
        path,
        headers: {
            "Content-Type": "application/json",
            "X-Functions-Key": key
        }
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

    return await executeWithStopwatchAsync(async () => {
        try {
            response.value = await https.send<T>(method, data);
            response.status = API_RESULT.SUCCESS;
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
        UI.backend.showEndpointNotFoundError(hostname, hostname === DEFAULT_HOST_NAME);
    }
    if (error.statusCode) {
        switch (error.statusCode) {
            case 401:
                UI.backend.showEndpointUnauthorizedError(hostname === DEFAULT_HOST_NAME);
        }
    }
}

export class Backend {
    static async getNextNo(appId: string, type: string, ranges: any, commit: boolean, authKey: string): Promise<NextObjectIdInfo | undefined> {
        let request: any = {
            appId,
            type,
            ranges,
            authKey,
        };

        if (Config.instance.includeUserName) {
            request.content = { user: Config.instance.userName };
        }

        const response = await sendRequest<NextObjectIdInfo>(
            "/api/v2/getNext",
            commit ? "POST" : "GET",
            request
        );
        if (response.status === API_RESULT.SUCCESS) output.log(`Received next ${type} ID response: ${JSON.stringify(response.value)}`);
        return response.value;
    }

    static async syncIds(appId: string, ids: ConsumptionInfo, patch: boolean, authKey: string): Promise<boolean> {
        const response = await sendRequest<ConsumptionInfo>(
            "/api/v2/syncIds",
            patch ? "PATCH" : "POST",
            { appId, ids, authKey }
        );
        return !!response.value;
    }

    static async autoSyncIds(consumptions: AuthorizedAppConsumption[], patch: boolean): Promise<boolean> {
        const response = await sendRequest<ConsumptionInfo>(
            "/api/v2/autoSyncIds",
            patch ? "PATCH" : "POST",
            { appFolders: consumptions }
        );
        return !!response.value;
    }

    static async authorizeApp(appId: string, errorHandler: ErrorHandler<AuthorizationInfo>): Promise<AuthorizationInfo | undefined> {
        const response = await sendRequest<AuthorizationInfo>(
            "/api/v2/authorizeApp",
            "POST",
            { appId },
            errorHandler
        );
        return response.value;
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

    static async getLog(payload: FolderAuthorization[]): Promise<FolderEventLogEntries[] | undefined> {
        const response = await sendRequest<FolderEventLogEntries[]>(
            "/api/v2/getLog",
            "GET",
            { appFolders: payload },
            async () => true // On error, do nothing (message is logged in the output already)
        );
        return response.value;
    }

    static async getConsumption(appId: string, authKey: string): Promise<ConsumptionInfoWithTotal | undefined> {
        const response = await sendRequest<ConsumptionInfoWithTotal>(
            "/api/v2/getConsumption",
            "GET",
            { appId, authKey },
        );
        return response.value;
    }

    static async getNews(): Promise<NewsEntry[]> {
        const response = await sendRequest<NewsResponse>(
            "/api/v2/news",
            "GET",
            {},
            undefined,
            NEWS_HOST_NAME
        );
        return response.value?.news || [];
    }
}
