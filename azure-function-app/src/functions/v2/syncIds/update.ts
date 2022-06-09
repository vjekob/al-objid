import { ALNinjaRequestContext, AppInfo, ObjectConsumptions } from "../TypesV2";
import { Blob } from "@vjeko.com/azure-func";

export async function updateConsumptions(appId: string, request: ALNinjaRequestContext, objectIds: ObjectConsumptions, patch: boolean): Promise<AppInfo> {
    let blob = new Blob<AppInfo>(`${appId}.json`);
    const app = await blob.optimisticUpdate(app => {
        if (!app) {
            app = {} as AppInfo;
        }

        request.log(app, patch ? "syncMerge" : "syncFull");

        let { _authorization, _ranges, _log, _pool, ...consumptions } = app;
        if (!patch) {
            consumptions = {} as ObjectConsumptions;
        }
        for (let key of Object.keys(objectIds)) {
            let existing = consumptions[key] || [];
            consumptions[key] = [...new Set([...(patch ? existing : []), ...objectIds[key]])].sort((left, right) => left - right);
        }
        return { _authorization, _ranges, _log, _pool, ...consumptions };
    });
    return app;
}
