import { PropertyBag } from "./PropertyBag";
import { getSha256 } from "./Sha256";

export class AppIdCache {
    private _map: PropertyBag<string> = {};
    private static _instance: AppIdCache;

    private constructor() {}

    public static get instance(): AppIdCache {
        return this._instance || (this._instance = new AppIdCache());
    }

    public getAppIdHash(appId: string): string {
        if (this._map[appId]) return this._map[appId];
        return (this._map[appId] = getSha256(appId));
    }
}
