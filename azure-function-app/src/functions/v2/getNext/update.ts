import { Blob } from "@vjeko.com/azure-func";
import { findFirstAvailableId } from "../../../common/util";
import { ALObjectType } from "../ALObjectType";
import { AppInfo, Range } from "../TypesV2";
import { ConsumptionUpdateContext } from "./types";

interface UpdateResult {
    app: AppInfo;
    success: boolean;
}

export async function updateConsumption(appId: string, type: ALObjectType, ranges: Range[], context: ConsumptionUpdateContext): Promise<UpdateResult> {
    let success = true;

    const blob = new Blob<AppInfo>(`${appId}.json`);
    const app = await blob.optimisticUpdate((app, attempts) => {
        if (attempts === 100) {
            success = false;
            return app;
        }

        context.updated = false;
        context.updateAttempts = attempts;

        if (!app) {
            app = {} as AppInfo;
        }

        app._ranges = ranges;
        const consumption = app[type];

        // No ids consumed yet, consume the first one and exit
        if (!consumption || !consumption.length) {
            context.updated = true;
            app[type] = [context.id]
            return { ...app };
        }

        if (consumption.indexOf(context.id) >= 0) {
            // Somebody has consumed this id in the meantime, retrieve the new one
            context.id = findFirstAvailableId(ranges, consumption);

            // If id is 0, then there are no numbers left, return the same array
            if (context.id === 0) {
                context.available = false;
                return app;
            }
        }

        context.updated = true;
        app[type] = [...consumption, context.id].sort((left, right) => left - right);
        return { ...app };
    });

    return { app, success };
}
