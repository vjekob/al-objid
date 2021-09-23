import { AppAuthorization } from "./AppAuthorization";
import { readAppAuthorization } from "./updates";

/**
 * IMPORTANT!
 * 
 * This cache is not bulletproof. It has this known vulnerability: when an unauthorized app becomes authorized,
 * and there are multiple instances of this Function App running, then for maximum of 10 minutes any running
 * instances that didn't handle the actual authorization request will allow access to the back-end data. After
 * those 10 minutes elapse, the authorization will be refreshed, and valid authorization key will have to be
 * present in each request.
 * 
 * This vulnerability is fully acceptable for a public, free service, for the following reasons:
 * 1) No private or sensitive data can be exposed by AL Object ID Ninja back end anyway
 * 2) Most likely there will only ever be one instance available which means authorization cache is always valid
 * 3) Potential attacker must know the app id of the app that they want to attack *AND* the attack must be
 *    launched within the first 10 minutes of the app becoming authorized
 * 
 * All of the above make successful access to data of an authorized app extremely unlikely.
 * 
 * However, if you still are not happy with this vulnerability being there, you should deploy this function app
 * to your own back end and secure it with funcion keys. That will allow you to fully control security and avoid
 * this vulnerability in the first place.
 * 
 * Keep in mind that this service when consumed from default public endpoints is completely free for you, and
 * that the reason why this vulnerability is allowed is because otherwise the _authorization.json blob would have
 * to be read on every function call, which incurs constat BLOB storage costs. By caching app authorization for
 * 10 minutes, the BLOB storage costs of accessing _authorization.json blob are reduced by a factor of at least 40.
 */

// Cache authorization state for 10 minutes
const CACHE_VALIDITY = 600000;

class AuthorizationToken {
    private _timestamp: number = 0;
    private _appId: string;
    private _authorization: Promise<AppAuthorization | null>;
    private _knownInvalidKeys: string[] = [];

    private async refreshBlob(): Promise<AppAuthorization> {
        let authorization = await readAppAuthorization(this._appId);
        this._knownInvalidKeys = [];
        this._timestamp = Date.now();
        return authorization || null;
    }

    private get expired() {
        return Date.now() - this._timestamp >= CACHE_VALIDITY;
    }

    private async checkAuthorizationKey(authKey: string): Promise<boolean> {
        const authorization = await this._authorization;
        if (!authorization) return true;

        const { valid, key } = authorization;
        return !valid || (key === authKey);
    }

    constructor(appId: string) {
        this._appId = appId;
    }

    public storeAuthorization(authorization: AppAuthorization | null) {
        this._knownInvalidKeys = [];
        this._timestamp = Date.now();
        this._authorization = Promise.resolve(authorization);
    }

    public async isAuthorized(authKey: string): Promise<boolean> {
        let freshBlob = false;
        if (this.expired) {
            freshBlob = true;
            this._authorization = this.refreshBlob();
        }

        if (await this.checkAuthorizationKey(authKey)) return true;

        if (freshBlob) {
            this._knownInvalidKeys.push(authKey);
        }
        if (this._knownInvalidKeys.includes(authKey)) return false;

        // If we are here, then it means that:
        // - cached unexpired token was used
        // - authorization doesn't match
        // This may indicate someone attempting to use incorrect key, so we must refresh
        this._authorization = this.refreshBlob();
        let result = await this.checkAuthorizationKey(authKey);
        if (!result) {
            this._knownInvalidKeys.push(authKey);
        }
        return result;
    }
}

interface AppAuthorizations {
    [key: string]: AuthorizationToken;
}

const authorizations: AppAuthorizations = {};

export const AuthorizationCache = {
    checkAuthorization: async (appId: string, authKey: string): Promise<boolean> => {
        let authorization = authorizations[appId];
        if (!authorization) {
            authorization = authorizations[appId] = new AuthorizationToken(appId);
        }

        return await authorization.isAuthorized(authKey);
    },

    storeAuthorization: (appId: string, key: string | null) => {
        if (!authorizations[appId]) {
            authorizations[appId] = new AuthorizationToken(appId);
        }
        authorizations[appId].storeAuthorization(key === null ? null : { valid: true, key })
    }
};
