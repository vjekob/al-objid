import { ConsumptionData } from "../lib/BackendTypes";
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
        let updated = JSON.stringify(this._cache[appId]) !== JSON.stringify(consumption);
        this._cache[appId] = consumption;
        ConsumptionWarnings.instance.checkRemainingIds(appId, consumption);
        return updated;
    }

    public getConsumption(appId: string): ConsumptionData {
        return this._cache[appId];
    }
}
