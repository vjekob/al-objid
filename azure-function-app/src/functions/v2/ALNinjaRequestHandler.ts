import { HandlerFunc, RequestHandler } from "@vjeko.com/azure-func";
import { injectValidators } from "./injectValidators";
import { AppCache } from "./TypesV2";

interface AppIdBody {
    appId: string;
    authKey?: string;
}

interface AppBindings {
    app: AppCache;
}

type ALNinjaBindings<T> = AppBindings & T;
type ALNinjaRequest<T> = AppIdBody & T;

injectValidators();

export class ALNinjaRequestHandler<TRequest, TResponse, TBindings>
    extends RequestHandler<ALNinjaRequest<TRequest>, TResponse, ALNinjaBindings<TBindings>> {
    private _skipAuthorization: boolean = false;

    public constructor(handler: HandlerFunc<TRequest, TResponse, ALNinjaBindings<TBindings>>) {
        super(handler);

        this.onAuthorization(async (req) => {
            if (this._skipAuthorization) {
                return true;
            }

            if (!req.body.appId) {
                return false;
            }

            await req.bind();

            const { app } = req.bindings;

            if (!app || !app._authorization || !app._authorization.valid) {
                return true;
            }

            return req.body.authKey === app._authorization.key;
        });

        this.bind("{appId}.json").to("app");
    }

    public skipAuthorization() {
        this._skipAuthorization = true;
    }
}
