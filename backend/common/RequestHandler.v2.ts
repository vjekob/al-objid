import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { AuthorizationCache } from "./AuthorizationCache";
import { RateLimiter } from "./RateLimiter";
import { ErrorResponse } from "./RequestHandler";

interface AppRequest {
    appId: string;
}

interface AuthorizedRequest extends AppRequest {
    authKey: string;
}

type AuthorizedBody = AuthorizedRequest | AuthorizedRequest[];

type HandlerFunc<TRequest, TResponse, TBindings> = (request: TRequest, bindings: TBindings) => Promise<ErrorResponse | TResponse>;

interface RequestHandler<TRequest = any, TResponse = any, TBindings = any> {
    handle: HandlerFunc<TRequest, TResponse, TBindings>;
}

export class AzureFunctionRequestHandler<TRequest = any, TResponse = any, TBindings = any> {
    private _handler: HandlerFunc<TRequest, TResponse, TBindings>;

    public constructor(handler: HandlerFunc<TRequest, TResponse, TBindings>) {
        this._handler = handler;
    }

    private isValidAuthorizationRequest(body: AuthorizedBody, context: Context): boolean {
        const check = (auth: AuthorizedRequest): boolean => {
            if (typeof auth !== "object" || !auth) {
                context.log("Parameter `appId` is not present.");
                return false;
            }

            let { appId, authKey } = auth;
            if (typeof appId !== "string" || !appId) {
                context.log("Parameter `appId` must be a non-zero-length string.");
                return false;
            }
            if (typeof authKey !== "undefined" && typeof authKey !== "string" || typeof authKey === "string" && !authKey) {
                context.log("Parameter `authKey` must be undefined or non zero-length-string.")
                return false;
            }
            return true;
        };

        if (Array.isArray(body)) {
            for (let app of body) {
                if (!check(app)) {
                    return false;
                }
            }
        } else {
            if (!check(body)) {
                return false;
            }
        }

        return true;
    }

    private async isAuthorized(body: AuthorizedBody): Promise<boolean> {
        let promises: Promise<any>[] = [];
        let result: boolean = true;

        const check = async (auth: AuthorizedRequest) => {
            let { appId, authKey } = auth;
            if (!await AuthorizationCache.checkAuthorization(appId, authKey)) {
                result = false;
            }
        };

        if (Array.isArray(body)) {
            for (let app of body) {
                promises.push(check(app));
            }
        } else {
            promises.push(check(body));
        }

        await Promise.all(promises);

        return result;
    }

    private respondBadRequest(context: Context): void {
        context.res = {
            status: 400,
            body: "Bad request format"
        };
    }

    private respondUnauthorized(context: Context): void {
        context.res = {
            status: 401,
            body: "Invalid credentials"
        };
    }

    private respondTooManyRequests(context: Context): void {
        context.res = {
            status: 429,
            body: "Chill down, will you please?"
        };
    }

    private async handleOne(context: Context, req: TRequest): Promise<false | TResponse> {
        let response = await this._handler(req, {} as TBindings);
        if (response instanceof ErrorResponse) {
            context.res = {
                status: response.status || 400,
                body: response.message
            };
            return false;
        }
        return response;
    }

    private async handleArray(context: Context, req: HttpRequest): Promise<void> {
        let body: TResponse[] = [];
        for (let one of req.body) {
            let handleResult = await this.handleOne(context, one);
            if (handleResult === false) {
                return;
            }
            body.push(handleResult);
        }
        context.res.body = body;
    }

    private async handleHttpRequest(context: Context, req: HttpRequest): Promise<void> {
        if (!RateLimiter.accept(req, context)) {
            return this.respondTooManyRequests(context);
        }

        if (!this.isValidAuthorizationRequest(req.body, context)) {
            return this.respondBadRequest(context);
        }

        if (!await this.isAuthorized(req.body)) {
            return this.respondUnauthorized(context);
        }

        if (Array.isArray(req.body)) {
            return await this.handleArray(context, req);
        }

        let handleResult = await this.handleOne(context, req.body);
        if (handleResult !== false) {
            context.res.body = handleResult;
        }
    }

    private async validate(req: HttpRequest): Promise<boolean> {
        return true;
    }

    public get azureFunction(): AzureFunction {
        return this.handleHttpRequest.bind(this);
    }
}
