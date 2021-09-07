import { workspace } from "vscode";
import { Https } from "./Https";
import { UI } from "./UI";

export interface NextObjectIdInfo {
    id: number;
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
}

export type ConsumptionInfo = {
    [key: string]: number[];
}

const DEFAULT_HOST_NAME = "vjekocom-alext-weu.azurewebsites.net";
const DEFAULT_API_KEY = "jMZkPxekwz8GmeEZaamr1eVYaYliZvshLzaeBiOu2/vBVDMmMyUUCQ==";

export const API_RESULT = {
    ERROR_HANDLED: Symbol("ERROR_HANDLED")
}

async function sendRequest<T>(path: string, method: "POST" | "GET", data: any): Promise<T | symbol | undefined> {
    const config = workspace.getConfiguration("objectidninja");
    const url = (config.get("backEndUrl") || "") as string;
    const key = (config.get("backEndAPIKey") || (url ? "" : DEFAULT_API_KEY) || "") as string;

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
    } catch (e: any) {
        if (e.error && e.error.code === "ENOTFOUND") {
            UI.backend.showEndpointNotFoundError(hostname, hostname === DEFAULT_HOST_NAME);
            return API_RESULT.ERROR_HANDLED;
        }
        if (e.statusCode) {
            switch (e.statusCode) {
                case 401:
                    UI.backend.showEndpointUnauthorizedError(hostname === DEFAULT_HOST_NAME && key === DEFAULT_API_KEY);
                    return API_RESULT.ERROR_HANDLED;
            }
        }
        return;
    }
}

export const Backend = {
    getNextNo: async (appId: string, type: string, ranges: any, commit: boolean): Promise<NextObjectIdInfo | undefined> => {
        const response = await sendRequest<NextObjectIdInfo>(
            "/api/v1/getNext",
            commit ? "POST" : "GET",
            {
                appId,
                type,
                ranges
            }
        );

        return typeof response === "object" ? response : undefined;
    },

    syncIds: async (appId: string, ids: ConsumptionInfo): Promise<boolean> => {
        const response = await sendRequest<ConsumptionInfo>(
            "/api/v1/syncIds",
            "POST",
            {
                appId,
                ids
            }
        );

        return !!response;
    }
}
