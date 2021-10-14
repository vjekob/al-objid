import { ConsumptionData } from "../lib/BackendTypes";

// TODO Use this together with ObjectIDHighlighter
export class ConsumptionCache {
    //#region Singleton
    private static _instance: ConsumptionCache;

    private constructor() { }

    public static get instance(): ConsumptionCache {
        return this._instance || (this._instance = new ConsumptionCache());
    }
    //#endregion

    private _cache: { [key: string]: ConsumptionData} = {};

    public updateConsumption(appId: string, consumption: ConsumptionData): boolean {
        let updated = JSON.stringify(this._cache[appId]) !== JSON.stringify(consumption);
        this._cache[appId] = consumption;
        return updated;
    }
}
