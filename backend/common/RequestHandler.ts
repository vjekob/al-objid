import { Context, HttpRequest } from "@azure/functions";
import { performance } from "perf_hooks";
import { AuthorizationCache } from "./AuthorizationCache";
import { TIMEOUT_TOKEN } from "./Blob";
import { RateLimiter } from "./RateLimiter";
import { RequestValidator } from "./RequestValidator";
import { BodyWithAppFolders, BodyWithAppId, BodyWithAuthorization, FolderAuthorization, IPAddress, TypedContext, TypedRequest } from "./types";

type HandlerFunc<TBindings, TBody> = (context: TypedContext<TBindings>, req: TypedRequest<TBody>) => Promise<any>;

interface AuthorizableBody extends BodyWithAppId, BodyWithAuthorization { }

export class ErrorResponse {
    public message: string;
    public status: number;

    constructor(message: string, status: number = 400) {
        this.message = message;
        this.status = status;
    }
}

const instanceId = Date.now();

const AUTHORIZATION_TYPE = {
    NONE: Symbol("NONE"),
    SINGLE: Symbol("SINGLE"),
    MULTI: Symbol("MULTI"),
};

interface HandleOptions {
    authorizationType: symbol;
}

export class RequestHandler {
    private static getHeaders(req: HttpRequest) {
        return {
            "x-object-id-ip-address": IPAddress.fromHeaders(req),
            "x-object-id-instance": instanceId
        };
    }

    private static async handleAuthorization(body: AuthorizableBody, context: Context): Promise<boolean> {
        let { appId, authKey } = body;
        if (await AuthorizationCache.checkAuthorization(appId, authKey)) return true;

        context.res = {
            status: 401,
            body: "You must provide valid credentials (appId, authKey) to access this endpoint"
        }
        return false;
    }

    private static async handleAuthorizationMulti(req: TypedRequest<BodyWithAppFolders>) {
        let validFolders: FolderAuthorization[] = [];
        let promises = [];
        const updateValidFolders = (folder: FolderAuthorization) => {
            return (valid) => {
                if (!valid || validFolders.find(f => f.appId === folder.appId)) return;
                validFolders.push(folder);
            }
        };
        if (req.body.appFolders && Array.isArray(req.body.appFolders)) {
            for (let folder of req.body.appFolders) {
                let { appId, authKey } = folder;
                promises.push(AuthorizationCache.checkAuthorization(appId, authKey).then(updateValidFolders(folder)));
            }
        }
        await Promise.all(promises);
        req.body.appFolders = validFolders;
    }

    private static handleValidation(req: HttpRequest, context: Context, validator?: RequestValidator): boolean {
        if (validator instanceof RequestValidator && !validator.validate(req)) {
            context.res = {
                headers: this.getHeaders(req),
                status: 400,
                body: validator.validationError,
            };
            return false;
        }
        return true;
    }

    private static handleRateLimiting(req: HttpRequest, context: Context): boolean {
        if (RateLimiter.accept(req, context)) return true;
        context.res = {
            headers: this.getHeaders(req),
            status: 429,
            body: "Chill down, will you please? And while you are at it, shame on you, too!"
        }
        return false;
    }

    private static async handleRequest<TBindings, TBody>(context: TypedContext<TBindings>, req: TypedRequest<TBody>, handler: HandlerFunc<TBindings, TBody>) {
        let start = performance.now();
        try {
            const result = await handler(context, req);
            if (result instanceof ErrorResponse) {
                context.res = {
                    headers: this.getHeaders(req),
                    status: result.status || 400,
                    body: result.message,
                };
            } else {
                context.res = {
                    headers: this.getHeaders(req),
                    status: 200,
                    body: result,
                };
            }
        } catch (e) {
            if (e === TIMEOUT_TOKEN) {
                context.res = {
                    headers: this.getHeaders(req),
                    status: 408,
                    body: `Request has timed out after ${performance.now() - start} ms.`
                }
            } else {
                context.res = {
                    headers: this.getHeaders(req),
                    status: 429,
                    body: `An unexpected error has occurred: ${JSON.stringify(e)}`
                }
            }
        }
    }

    private static async processRequest<TBindings, TBody>(context: Context, req: HttpRequest, handler: HandlerFunc<TBindings, TBody>, options: HandleOptions, validator?: RequestValidator) {
        if (!this.handleRateLimiting(req, context)) return;

        if (options.authorizationType === AUTHORIZATION_TYPE.SINGLE) {
            if (!await this.handleAuthorization(req.body, context)) return;
        }

        if (!this.handleValidation(req, context, validator)) return;

        if (options.authorizationType === AUTHORIZATION_TYPE.MULTI) {
            await this.handleAuthorizationMulti(req as any);
        }

        await this.handleRequest(context, req as any, handler);
    }

    public static handleAppFoldersAuthorized<TBindings, TBody>(handler: HandlerFunc<TBindings, TBody>, validator?: RequestValidator) {
        return async (context: Context, req: HttpRequest) => this.processRequest(
            context,
            req,
            handler,
            {
                authorizationType: AUTHORIZATION_TYPE.MULTI
            },
            validator
        );
    }

    public static handleAuthorized<TBindings, TBody>(handler: HandlerFunc<TBindings, TBody>, validator?: RequestValidator) {
        return async (context: Context, req: HttpRequest) => this.processRequest(
            context,
            req,
            handler,
            {
                authorizationType: AUTHORIZATION_TYPE.SINGLE
            },
            validator
        );
    }

    public static handle<TBindings, TBody>(handler: HandlerFunc<TBindings, TBody>, validator?: RequestValidator) {
        return async (context: Context, req: HttpRequest) => this.processRequest(
            context,
            req,
            handler,
            {
                authorizationType: AUTHORIZATION_TYPE.NONE
            },
            validator
        );
    }
}
