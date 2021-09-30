import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { AuthorizationCache } from "../../common/AuthorizationCache";
import { RateLimiter } from "../../common/RateLimiter";
import { ErrorResponse } from "../../common/ErrorResponse";
import { PropertyBinder, RequestBinder } from "./RequestBinder";
import { RequestValidator } from "./RequestValidator";

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
    private _validator = new RequestValidator();
    private _binder = new RequestBinder();

    public constructor(handler: HandlerFunc<TRequest, TResponse, TBindings>) {
        this._handler = handler;
    }

    private isValidAuthorizationRequest(body: AuthorizedBody, context: Context): string | true {
        const check = (auth: AuthorizedRequest): string | true => {
            if (typeof auth !== "object" || !auth) {
                return "Parameter `appId` is not present.";
            }

            let { appId, authKey } = auth;
            if (typeof appId !== "string" || !appId) {
                return "Parameter `appId` must be a non-zero-length string.";
            }
            if (typeof authKey !== "undefined" && typeof authKey !== "string" || typeof authKey === "string" && !authKey) {
                return "Parameter `authKey` must be undefined or non zero-length-string.";
            }
            return true;
        };

        if (Array.isArray(body)) {
            for (let app of body) {
                let result = check(app);
                if (result !== true) {
                    return result;
                }
            }
        } else {
            let result = check(body);
            if (result !== true) {
                return result;
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

    private respondBadRequest(context: Context, body?: string): void {
        context.res = {
            status: 400,
            body: { error: body || "Bad request format" }
        };
    }

    private respondUnauthorized(context: Context): void {
        context.res = {
            status: 401,
            body: { error: "Invalid credentials" }
        };
    }

    private respondTooManyRequests(context: Context): void {
        context.res = {
            status: 429,
            body: { error: "Chill down, will you please?" }
        };
    }

    private async handleOne(context: Context, req: TRequest): Promise<false | TResponse> {
        let bindings = await this._binder.getBindings<TBindings>(context, req);
        let response = await this._handler(req, bindings);
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
        const { body } = req;

        if (!RateLimiter.accept(req, context)) {
            return this.respondTooManyRequests(context);
        }

        let authValidation = this.isValidAuthorizationRequest(body, context);
        if (authValidation !== true) {
            return this.respondBadRequest(context, authValidation);
        }

        if (!await this.isAuthorized(body)) {
            return this.respondUnauthorized(context);
        }

        if (!this.validate(context, body)) return;

        if (Array.isArray(body)) {
            return await this.handleArray(context, req);
        }

        let handleResult = await this.handleOne(context, body);
        if (handleResult !== false) {
            context.res.status = 200;
            context.res.body = handleResult;
        }
    }

    private validate(context: Context, body: any): boolean {
        if (Array.isArray(body)) {
            for (let one of body) {
                let result = this._validator.validate(one);
                if (typeof result === "string") return (this.respondBadRequest(context, result), false);
            }
            return true;
        }
        let result = this._validator.validate(body);
        if (typeof result === "string") return (this.respondBadRequest(context, result), false);

        return true;
    }

    public bind(blob: string): PropertyBinder {
        return this._binder.getPropertyBinder(blob);
    }

    public get validator() {
        return this._validator;
    }

    public get azureFunction(): AzureFunction {
        return this.handleHttpRequest.bind(this);
    }
}
