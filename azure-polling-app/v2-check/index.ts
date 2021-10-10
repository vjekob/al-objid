import { RequestHandler, RequestValidator } from "@vjeko.com/azure-func";
import AppCache from "../src/AppCache";
import NewsCache from "../src/NewsCache";
import { CheckRequest, CheckResponse } from "../src/types";

RequestValidator.defineValidator("CheckRequestEntry", (value) => {
    if (typeof value !== "object" || !value) {
        return `non-null object expected, received "${typeof value}"`;
    }
    if (typeof value.appId !== "string" || !value.appId) {
        return `"appId" must be a non-empty string`;
    }
    if (value.authKey && typeof value.authKey !== "string") {
        return `"authKey" must be a string, received "${typeof value.authKey}"`;
    }
    return true;
});

const check = new RequestHandler<CheckRequest, CheckResponse>(async (request) => {
    const result = {} as CheckResponse;

    if (Array.isArray(request.body)) {
        for (let entry of request.body) {
            result[entry.appId] = await AppCache.getApp(entry.appId);
        }
    } else {
        result[request.body.appId] = await AppCache.getApp(request.body.appId);
    }

    result._news = await NewsCache.getNews();

    return result;
});

check.onAuthorization(async (request) => {
    if (!request?.body) {
        return true; // A body not being present is not an authorization issue, it's a validation issue
    }

    const requests = Array.isArray(request.body) ? request.body : [request.body];
    for (let entry of requests) {
        if (!await AppCache.isAuthorized(entry.appId, entry.authKey)) {
            return false;
        }
    }
    return true;
});

check.validator.expect("body", "CheckRequestEntry[?]");

export default check.azureFunction;
