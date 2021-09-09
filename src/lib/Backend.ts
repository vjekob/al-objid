import { workspace } from "vscode";
import { HttpMethod, Https } from "./Https";
import { UI } from "./UI";

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

export interface HttpResponse<T> {
    error: any,
    status: symbol,
    value: T
};

const DEFAULT_HOST_NAME = "vjekocom-alext-weu.azurewebsites.net";

export const API_RESULT = {
    SUCCESS: Symbol("SUCCESS"),
    ERROR_HANDLED: Symbol("ERROR_HANDLED"),
    ERROR_ALREADY_AUTHORIZED: Symbol("ALREADY_AUTHORIZED"),
    ERROR_NOT_AUTHORIZED: Symbol("NOT_AUTHORIZED"),
    ERROR_INVALID_AUTH_KEY: Symbol("ERROR_INVALID_AUTH_KEY")
}

type ErrorHandler<T> = (error: any, hostname: string) => Promise<T | symbol | undefined>;

// TODO: this Promise<T | symbol | undefined> is a mess! There should be a HttpResponse<T> class that includes error: any, status: symbol, and result: T
async function sendRequest<T>(path: string, method: HttpMethod, data: any, errorHandler: ErrorHandler<T>): Promise<T | symbol | undefined> {
    const config = workspace.getConfiguration("objectidninja");
    const url = (config.get("backEndUrl") || "") as string;
    const key = (config.get("backEndAPIKey") ||  "") as string;

    const hostname = url || DEFAULT_HOST_NAME;
    const https = new Https({
        hostname,
        path,
        headers: {
            "Content-Type": "application/json",
            "X-Functions-Key": key
        }
    });

    try {
        return await https.send<T>(method, data);
    } catch (error: any) {
        return errorHandler(error, hostname);
    }
}

function preHandleError(error: any, hostname: string): symbol | undefined {
    if (error.error && error.error.code === "ENOTFOUND") {
        UI.backend.showEndpointNotFoundError(hostname, hostname === DEFAULT_HOST_NAME);
        return API_RESULT.ERROR_HANDLED;
    }
    if (error.statusCode) {
        switch (error.statusCode) {
            case 401:
                UI.backend.showEndpointUnauthorizedError(hostname === DEFAULT_HOST_NAME);
                return API_RESULT.ERROR_HANDLED;
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
            },
            async () => {
                // TODO: log error
                return undefined;
            }
        );

        return typeof response === "object" ? response : undefined;
    }

    static async syncIds(appId: string, ids: ConsumptionInfo, authKey: string): Promise<boolean> {
        const response = await sendRequest<ConsumptionInfo>(
            "/api/v1/syncIds",
            "POST",
            {
                appId,
                ids,
                authKey
            },
            async (error, hostname) => {
                let result = preHandleError(error, hostname);
                if (result) return result;
            }
        );

        return !!response;
    }

    static async authorizeApp(appId: string): Promise<AuthorizationInfo | symbol | undefined> {
        const response = await sendRequest<AuthorizationInfo>(
            "/api/v1/authorizeApp",
            "POST",
            { appId },
           async (error, hostname) => {
                if (error.statusCode === 405) return API_RESULT.ERROR_ALREADY_AUTHORIZED;
                let result = preHandleError(error, hostname);
                return result || {} as AuthorizationInfo;
            }
        );

        return response;
    }

    static async deauthorizeApp(appId: string, authKey: string): Promise<boolean> {
        const response = await sendRequest<AuthorizationDeletedInfo>(
            "/api/v1/authorizeApp",
            "DELETE",
            { appId, authKey },
            async (error, hostname) => {
                if (error.statusCode === 401) {
                    UI.authorization.showIncorrectKeyWarning(appId);
                    return {} as AuthorizationDeletedInfo;
                }
                if (error.statusCode === 405) {
                    UI.authorization.showNotAuthorizedWarning(appId);
                    return {} as AuthorizationDeletedInfo;
                }
                let result = preHandleError(error, hostname);
                return result;
            }
        );
        return typeof response === "object" && response.deleted;
    }
}
