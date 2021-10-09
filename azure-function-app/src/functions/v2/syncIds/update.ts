import { AppCache, ObjectConsumptions } from "../TypesV2";
import { Blob } from "@vjeko.com/azure-func";

export async function updateConsumptions(appId: string, objectIds: ObjectConsumptions, patch: boolean): Promise<ObjectConsumptions> {
    let blob = new Blob<AppCache>(`${appId}.json`);
    const app = await blob.optimisticUpdate(app => {
        let { _authorization, _ranges, ...consumptions } = app;
        if (!patch) {
            consumptions = {} as ObjectConsumptions;
        }
        for (let key of Object.keys(objectIds)) {
            let existing = consumptions[key] || [];
            consumptions[key] = [...new Set([...(patch ? existing : []), ...objectIds[key]])].sort((left, right) => left - right);
        }
        return { _authorization, _ranges, ...consumptions };
    });
    const { _authorization, _ranges, ...result } = app;
    return result;
}
