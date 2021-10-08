import { Blob } from "@vjeko.com/azure-func";
import { ALObjectType } from "../ALObjectType";
import { AppCache } from "../TypesV2";
import { GetNextResponse } from "./types";

export async function updateConsumption(appId: string, type: ALObjectType, ranges: Range[], response: GetNextResponse): Promise<boolean> {
    let tooManyAttempts = false;

    const blob = new Blob<AppCache>(`${appId}.json`);
    // await blob.optimisticUpdate(function (app, attempts) {
    //     const ids = app[type];

    //     // No ids consumed yet, consume the first one and exit
    //     if (!ids) {
    //         app[type] = response.ids;
    //         return { ...app };
    //     }

    //     if (attempts === 100) {
    //         tooManyAttempts = true;
    //         return app;
    //     }

    //     if (app[type].indexOf(context.id) >= 0) {
    //         // Somebody has consumed this id in the meantime, retrieve the new one
    //         context.id = findFirstAvailableId(ranges, app);

    //         // If id is 0, then there are no numbers left, return the same array
    //         if (context.id === 0) {
    //             context.available = false;
    //             return app;
    //         }
    //     }

    //     context.updated = true;
    //     return [...app, context.id].sort((left, right) => left - right);
    // });

    return !tooManyAttempts;
}

