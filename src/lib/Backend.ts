import { workspace } from "vscode";
import { HttpMethod, Https } from "./Https";
import { UI } from "./UI";

type ErrorHandler<T> = (response: HttpResponse<T>, request: HttpRequest) => Promise<boolean>;

interface HttpRequest {
    hostname: string,
    path: string,
    method: string,
    data: any
};

interface HttpResponse<T> {
    error: any,
    status: symbol,
    value?: T,
};

const DEFAULT_HOST_NAME = "vjekocom-alext-weu.azurewebsites.net";

export interface NextObjectIdInfo {
    id: number;
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
}

export interface ConsumptionInfo {
    [key: string]: number[];
}

export interface AuthorizationInfo {
    authKey: string;
}

export interface AuthorizationDeletedInfo {
    deleted: boolean;
}

export const API_RESULT = {
    NOT_SENT: Symbol("NOT_SENT"),
    SUCCESS: Symbol("SUCCESS"),
    ERROR_HANDLED: Symbol("ERROR_HANDLED"),
    ERROR_NOT_HANDLED: Symbol("ERROR_NOT_HANDLED"),
    ERROR_ALREADY_AUTHORIZED: Symbol("ALREADY_AUTHORIZED"),
    ERROR_NOT_AUTHORIZED: Symbol("NOT_AUTHORIZED"),
    ERROR_INVALID_AUTH_KEY: Symbol("ERROR_INVALID_AUTH_KEY")
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
async function sendRequest<T>(path: string, method: HttpMethod, data: any, errorHandler?: ErrorHandler<T>): Promise<HttpResponse<T>> {
    const config = workspace.getConfiguration("objectidninja");
    const url = (config.get("backEndUrl") || "") as string;
    const key = (config.get("backEndAPIKey") || "") as string;

    const hostname = url || DEFAULT_HOST_NAME;
    const https = new Https({
        hostname,
        path,
        headers: {
            "Content-Type": "application/json",
            "X-Functions-Key": key
        }
    });

    const request: HttpRequest = { hostname, path, method, data };
    const response: HttpResponse<T> = {
        error: null,
        status: API_RESULT.NOT_SENT,
    };

    try {
        response.value = await https.send<T>(method, data);
    } catch (error: any) {
        // TODO: log error
        response.error = error;
        response.status = API_RESULT.ERROR_NOT_HANDLED;
        if (!errorHandler || !(await errorHandler(response, request))) handleErrorDefault(response, request);
    }
    return response;
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
        const response = await sendRequest<NextObjectIdInfo>(
            "/api/v1/getNext",
            commit ? "POST" : "GET",
            {
                appId,
                type,
                ranges,
                authKey
            }
        );

        return response.value;
    }

    static async syncIds(appId: string, ids: ConsumptionInfo, authKey: string): Promise<boolean> {
        const response = await sendRequest<ConsumptionInfo>(
            "/api/v1/syncIds",
            "POST",
            { appId, ids, authKey }
        );

        return !!response.value;
    }

    static async authorizeApp(appId: string, errorHandler: ErrorHandler<AuthorizationInfo>): Promise<AuthorizationInfo | undefined> {
        const response = await sendRequest<AuthorizationInfo>(
            "/api/v1/authorizeApp",
            "POST",
            { appId },
            errorHandler
        );

        return response.value;
    }

    static async deauthorizeApp(appId: string, authKey: string, errorHandler: ErrorHandler<AuthorizationDeletedInfo>): Promise<boolean> {
        const response = await sendRequest<AuthorizationDeletedInfo>(
            "/api/v1/authorizeApp",
            "DELETE",
            { appId, authKey },
            errorHandler
        );
        return typeof response.value === "object" && response.value.deleted;
    }
}
