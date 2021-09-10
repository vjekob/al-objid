import { PropertyBag } from "./PropertyBag";
import * as crypto from "crypto";

export class AppIdCache {
    private _map: PropertyBag<string> = {};
    private static _instance: AppIdCache;

    private constructor() {}

    public static get instance(): AppIdCache {
        return this._instance || (this._instance = new AppIdCache());
    }

    public getAppIdHash(appId: string): string {
        if (this._map[appId]) return this._map[appId];

        const sha256 = crypto.createHash("sha256");
        return this._map[appId] = sha256.digest("hex").replace("/", "-");
    }
}
