import { HandlerFunc, RequestHandler } from "@vjeko.com/azure-func";
import { injectValidators } from "./injectValidators";
import { AppBindings } from "./TypesV2";

injectValidators();

interface AppIdBody {
    appId: string;
    authKey?: string;
}

type ALNinjaBindings<T> = AppBindings & T;
type ALNinjaRequest<T> = AppIdBody & T;

export class ALNinjaRequestHandler<TRequest, TResponse, TBindings>
    extends RequestHandler<ALNinjaRequest<TRequest>, TResponse, ALNinjaBindings<TBindings>> {
    private _skipAuthorization: boolean = false;

    public constructor(handler: HandlerFunc<ALNinjaRequest<TRequest>, TResponse, ALNinjaBindings<TBindings>>, withValidation: boolean = true) {
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
