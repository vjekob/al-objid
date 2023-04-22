import { NotificationsFromLog } from "../../features/NotificationsFromLog";
import { output } from "../../features/Output";
import { ConsumptionData } from "../types/ConsumptionData";
import { EventLogEntry } from "../types/EventLogEntry";
import { Config } from "../Config";
import { HttpMethod, Https } from "./Https";
import { executeWithStopwatchAsync } from "../MeasureTime";
import { ConsumptionCache } from "../../features/ConsumptionCache";
import { API_RESULT } from "../constants";
import { WorkspaceManager } from "../../features/WorkspaceManager";
import { HttpRequest } from "./HttpRequest";
import { HttpResponse } from "./HttpResponse";
import { HttpEndpoint } from "./HttpEndpoint";
import { HttpErrorHandler } from "./HttpErrorHandler";
import { HttpEndpoints } from "./HttpEndpoints";
import { preprocessHttpStatusError } from "./preprocessHttpStatusError";
import { handleHttpErrorDefault } from "./handleHttpErrorDefault";
import { isProtectedPublisher } from "../functions/isProtectedPublisher";

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
export async function sendRequest<T>(
    path: string,
    method: HttpMethod,
    data: any = {},
    errorHandler?: HttpErrorHandler<T>,
    endpoint: HttpEndpoint = HttpEndpoints.default
): Promise<HttpResponse<T>> {
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
        headers,
    });

    if (Config.instance.useVerboseOutputLogging) {
        let { authKey, ...log } = data;
        output.log(
            `[Verbose] sending request to https://${hostname}${path}: ${JSON.stringify(
                Array.isArray(data) ? data : log
            )}`
        );
    }

    const request: HttpRequest = { hostname, path, method, data };
    const response: HttpResponse<T> = {
        error: null,
        status: API_RESULT.NOT_SENT,
    };

    if (Config.instance.includeUserName && data && typeof data === "object" && !Array.isArray(data) && data.appId) {
        const app = WorkspaceManager.instance.getALAppFromHash(data.appId);
        if (app && !isProtectedPublisher(app?.manifest.publisher)) {
            data.user = app.encrypt(Config.instance.userName);
        }
    }

    return await executeWithStopwatchAsync(async () => {
        try {
            response.value = await https.send<T>(method, data);
            response.status = API_RESULT.SUCCESS;

            const appInfo = (response.value as any)?._appInfo;
            if (appInfo) {
                const { appId } = data;
                const { _log, ...consumptions } = appInfo;
                const app = WorkspaceManager.instance.getALAppFromHash(appId);
                if (app) {
                    NotificationsFromLog.instance.updateLog(appId, _log as EventLogEntry[], app.manifest.name);
                    ConsumptionCache.instance.updateConsumption(appId, consumptions as ConsumptionData);
                }
            }
        } catch (error: any) {
            if (preprocessHttpStatusError(error)) {
                response.error = error;
                response.status = API_RESULT.ERROR_HANDLED;
                return response;
            }
            output.log(`Sending ${method} request to ${path} endpoint resulted in an error: ${JSON.stringify(error)}`);
            response.error = error;
            response.status = API_RESULT.ERROR_NOT_HANDLED;
            if (!errorHandler || !(await errorHandler(response, request))) handleHttpErrorDefault(response, request);
        }
        return response;
    }, `Sending ${method} request to ${path} endpoint`);
}
