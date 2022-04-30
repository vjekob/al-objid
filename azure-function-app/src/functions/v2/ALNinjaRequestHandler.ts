import { RequestHandler } from "@vjeko.com/azure-func";
import { injectValidators } from "./injectValidators";
import { ALNinjaRequestContext, AppBindings, AppInfo, DefaultBindings } from "./TypesV2";

injectValidators();

interface AppIdBody {
    appId: string;
    authKey?: string;
    user: string;
}

type ALNinjaBindings<T> = AppBindings & T;
type ALNinjaRequest<T> = AppIdBody & T;

interface ALNinjaHandlerFunc<TRequest, TResponse, TBindings> {
    (context: ALNinjaRequestContext<ALNinjaRequest<TRequest>, ALNinjaBindings<TBindings>>): Promise<TResponse>;
}

export class ALNinjaRequestHandler<TRequest, TResponse, TBindings = DefaultBindings>
    extends RequestHandler<ALNinjaRequest<TRequest>, TResponse, ALNinjaBindings<TBindings>> {
    private _skipAuthorization: boolean = false;

    public constructor(handler: ALNinjaHandlerFunc<TRequest, TResponse, TBindings>, withValidation: boolean = true) {
        super(async (request) => {
            const alNinjaRequest = (request as unknown as ALNinjaRequestContext<TRequest, TBindings>);
            alNinjaRequest.log = (app, eventType, data) => {
                const user = request.body && request.body.user;
                const timestamp = Date.now();
                const minTimestamp = timestamp - (4 * 60 * 60 * 1000); // Keep log entries for 4 hours
                const log = (app._log || []).filter(entry => entry.timestamp > minTimestamp);
                if (user) {
                    log.push({
                        timestamp,
                        eventType,
                        user: request.body.user,
                        data
                    });
                }
                app._log = log;
            };
            let appUpdated: AppInfo | null = null;
            alNinjaRequest.markAsChanged = (appId, app, authorization) => {
                appUpdated = app;
                const payload: any = { appId };
                if (authorization) {
                    payload.authorization = authorization;
                }
                request.rawContext.bindings.notify = payload;
            };

            const response = await handler(request as any);

            if (appUpdated) {
                const { _authorization, _ranges, ...appInfo } = appUpdated;
                (response as any)._appInfo = appInfo;
            }
            return response;
        });

        this.onAuthorization(async (req) => {
            if (this._skipAuthorization) {
                return true;
            }

            if (!req.body.appId) {
                /*
                We cannot treat requests without appId as unauthorized!
                If there is something wrong with these requests, these apply:
                - They will fail validation (if appId is required)
                - Actual function handler should take care of these requests
                */
                return true;
            }

            await req.bind();

            const { app } = req.bindings;

            if (!app || !app._authorization || !app._authorization.valid) {
                return true;
            }

            return req.body.authKey === app._authorization.key;
        });

        this.bind("{appId}.json").to("app");

        if (withValidation) {
            this.validator.expect("body", {
                "appId": "string"
            });
        }
    }

    public skipAuthorization() {
        this._skipAuthorization = true;
    }
}
