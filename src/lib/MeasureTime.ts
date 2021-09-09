import { performance } from "perf_hooks";
import { output } from "../features/Output";
import { PropertyBag } from "./PropertyBag";

export class MeasureTime {
    private static _descriptions: PropertyBag<string> = {};
    private static _startTimes: PropertyBag<number> = {};
    private static _durations: PropertyBag<number> = {};

    public static start(moniker: string, description?: string) {
            this._startTimes[moniker] = performance.now();
            if (description) {
                this._descriptions[moniker] = description;
            }
    }

    public static stop(...monikers: string[]) {
        for (let moniker of monikers) {
            this._durations[moniker] = (this._durations[moniker] || 0) + performance.now() - this._startTimes[moniker];
        }
    }

    public static reset(...monikers: string[]) {
        for (let moniker of monikers) {
            delete this._startTimes[moniker];
            delete this._durations[moniker];
            delete this._descriptions[moniker];
        }
    }

    public static log(...monikers: string[]) {
        for (let moniker of monikers) {
            output.log(`Executing ${this._descriptions[moniker] || moniker} took ${this._durations[moniker] || 0} milliseconds`);
        }
    }
}
