import { Disposable, Event, EventEmitter } from "vscode";
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
    private readonly _onConsumptionUpdateEmitter = new EventEmitter<ConsumptionEventInfo>();
    private readonly _onConsumptionUpdateEvent = this._onConsumptionUpdateEmitter.event;

    public onConsumptionUpdate(appId: string, onUpdate: (consumption: ConsumptionData) => void): Disposable {
        return this._onConsumptionUpdateEvent(e => {
            if (e.appId === appId) {
                onUpdate(e.consumption);
            }
        });
    }

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
            this._onConsumptionUpdateEmitter.fire({ appId, consumption });
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
        this._onConsumptionUpdateEmitter.dispose();
    }
}
