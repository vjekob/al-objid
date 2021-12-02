import { ConsumptionData } from "../lib/BackendTypes";
import { OBJECT_TYPES } from "../lib/constants";
import { PropertyBag } from '../lib/PropertyBag';
import { ConsumptionWarnings } from "./ConsumptionWarnings";

export class ConsumptionCache {
    //#region Singleton
    private static _instance: ConsumptionCache;

    private constructor() { }

    public static get instance(): ConsumptionCache {
        return this._instance || (this._instance = new ConsumptionCache());
    }
    //#endregion

    private _cache: PropertyBag<ConsumptionData> = {};

    public updateConsumption(appId: string, consumption: ConsumptionData): boolean {
        const keys = Object.keys(consumption);
        for (let key of keys) {
            if (!OBJECT_TYPES.includes(key)) {
                delete (consumption as any)[key];
            }
        }
        let updated = JSON.stringify(this._cache[appId]) !== JSON.stringify(consumption);
        this._cache[appId] = consumption;
        ConsumptionWarnings.instance.checkRemainingIds(appId, consumption);
        return updated;
    }

    public getConsumption(appId: string): ConsumptionData {
        return this._cache[appId];
    }
}
