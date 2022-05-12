import { PropertyBag } from "./PropertyBag";
import { getSha256 } from "./Sha256";

export class __AppIdCache_obsolete_ {
    private _map: PropertyBag<string> = {};
    private static _instance: __AppIdCache_obsolete_;

    private constructor() {}

    public static get instance(): __AppIdCache_obsolete_ {
        return this._instance || (this._instance = new __AppIdCache_obsolete_());
    }

    public getAppIdHash(appId: string): string {
        if (this._map[appId]) return this._map[appId];
        return (this._map[appId] = getSha256(appId));
    }
}
