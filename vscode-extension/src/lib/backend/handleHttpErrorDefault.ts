import { Config } from "../Config";
import { UI } from "../UI";
import { HttpRequest } from "./HttpRequest";
import { HttpResponse } from "./HttpResponse";

export function handleHttpErrorDefault<T>(response: HttpResponse<T>, request: HttpRequest): void {
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
