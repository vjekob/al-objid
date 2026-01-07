import { MultiAppHttpHandler, createEndpoint, validate, array, optional, appRequestOptional, AppBinding, UserInfo } from "../../../http";
import { validateObjectConsumptions } from "../../../utils";
import { logAppEvent } from "../../../utils/logging";
import { AppInfo, ObjectConsumptions } from "../../../types";
import { createSyncConsumptionsUpdateCallback } from "./updateCallbacks";
import { AppCache } from "../../../cache";

interface AppConsumptionData {
    ids: ObjectConsumptions;
}

interface AutoSyncIdsResponse {
    [key: string]: ObjectConsumptions;
}

async function processApps(apps: AppBinding<AppConsumptionData>[], patch: boolean, user: UserInfo | undefined): Promise<AutoSyncIdsResponse> {
    const result: AutoSyncIdsResponse = {};

    for (const binding of apps) {
        const updatedApp = await binding.blob.optimisticUpdate(
            createSyncConsumptionsUpdateCallback({ objectIds: binding.data.ids, patch }),
            {} as AppInfo
        );
        AppCache.set(binding.id, updatedApp);

        const { _authorization, _ranges, ...consumptions } = updatedApp;
        result[binding.id] = consumptions;

        // Log the sync event
        await logAppEvent(binding.id, patch ? "syncMerge" : "syncFull", user);

        //TODO: Queue notification - old: request.markAsChanged(binding.id, updatedApp)
    }

    return result;
}

// POST - Auto-sync IDs for multiple apps (full replacement)
// Uses MultiAppHttpRequest - authorization is handled per-app via authKey in body
const post: MultiAppHttpHandler<AppConsumptionData[], AutoSyncIdsResponse> = async (req) => {
    return processApps(req.apps as AppBinding<AppConsumptionData>[], false, req.user);
};

// PATCH - Auto-sync IDs for multiple apps (merge with existing)
// Uses MultiAppHttpRequest - authorization is handled per-app via authKey in body
const patch: MultiAppHttpHandler<AppConsumptionData[], AutoSyncIdsResponse> = async (req) => {
    return processApps(req.apps as AppBinding<AppConsumptionData>[], true, req.user);
};

appRequestOptional(post, true);
appRequestOptional(patch, true);

validate(post, array({
    appId: "string",
    authKey: optional("string"),
    ids: validateObjectConsumptions,
}));

validate(patch, array({
    appId: "string",
    authKey: optional("string"),
    ids: validateObjectConsumptions,
}));

export const autoSyncIds = createEndpoint({
    moniker: "v3-autoSyncIds",
    route: "v3/autoSyncIds",
    POST: post,
    PATCH: patch,
});
