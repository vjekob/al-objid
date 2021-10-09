import { RequestContext, RequestHandler } from "@vjeko.com/azure-func";
import { injectValidators } from "./injectValidators";
import { AppBindings, AppCache, DefaultBindings } from "./TypesV2";

injectValidators();

interface AppIdBody {
    appId: string;
    authKey?: string;
}

type ALNinjaBindings<T> = AppBindings & T;
type ALNinjaRequest<T> = AppIdBody & T;

interface ALNinjaRequestContext<TRequest, TBindings> extends RequestContext<TRequest, TBindings> {
    markAsChanged(appId: string, app: AppCache): void;
}

interface ALNinjaHandlerFunc<TRequest, TResponse, TBindings> {
    (context: ALNinjaRequestContext<ALNinjaRequest<TRequest>, ALNinjaBindings<TBindings>>): Promise<TResponse>;
}

export class ALNinjaRequestHandler<TRequest, TResponse, TBindings = DefaultBindings>
    extends RequestHandler<ALNinjaRequest<TRequest>, TResponse, ALNinjaBindings<TBindings>> {
    private _skipAuthorization: boolean = false;

    public constructor(handler: ALNinjaHandlerFunc<TRequest, TResponse, TBindings>, withValidation: boolean = true) {
        super((request) => {
            const alNinjaRequest = (request as unknown as ALNinjaRequestContext<TRequest, TBindings>);
            alNinjaRequest.markAsChanged = (appId, app) => {
                request.rawContext.bindings.notify = { appId, app };
            }
            return handler(request as any);
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
