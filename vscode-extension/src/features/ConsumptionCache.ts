import { Disposable, EventEmitter } from "vscode";
import { ConsumptionData } from "../lib/types/ConsumptionData";
import { ALObjectType } from "../lib/types/ALObjectType";
import { PropertyBag } from "../lib/types/PropertyBag";
import { ConsumptionWarnings } from "./ConsumptionWarnings";

export interface ConsumptionEventInfo {
    appId: string;
    consumption: ConsumptionData;
}

export class ConsumptionCache implements Disposable {
    //#region Singleton
    private static _instance: ConsumptionCache;

    private constructor() {}

    public static get instance(): ConsumptionCache {
        return this._instance || (this._instance = new ConsumptionCache());
    }
    //#endregion

    private _disposed: boolean = false;
    private _cache: PropertyBag<ConsumptionData> = {};
    private readonly _onConsumptionUpdate = new EventEmitter<ConsumptionEventInfo>();

    public readonly onConsumptionUpdate = this._onConsumptionUpdate.event;

    public updateConsumption(appId: string, consumption: ConsumptionData): boolean {
        const keys = Object.keys(consumption);
        for (let key of keys) {
            if (!Object.values<string>(ALObjectType).includes(key)) {
                delete (consumption as any)[key];
            }
        }
        let updated = JSON.stringify(this._cache[appId]) !== JSON.stringify(consumption);
        if (updated) {
            this._cache[appId] = consumption;
            ConsumptionWarnings.instance.checkRemainingIds(appId, consumption);
            this._onConsumptionUpdate.fire({ appId, consumption });
        }
        return updated;
    }

    public getConsumption(appId: string): ConsumptionData {
        return this._cache[appId];
    }

    dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._onConsumptionUpdate.dispose();
    }
}
