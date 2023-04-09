import { Blob } from "@vjeko.com/azure-func";
import { ALObjectType } from "../ALObjectType";
import { ALNinjaRequestContext, AppInfo } from "../TypesV2";

interface UpdateResult {
    app: AppInfo;
    success: boolean;
}

export async function addAssignment(appId: string, request: ALNinjaRequestContext, type: ALObjectType, id: number): Promise<UpdateResult> {
    let success = true;

    const blob = new Blob<AppInfo>(`${appId}.json`);
    const app = await blob.optimisticUpdate((app) => {
        if (!app) {
            app = {} as AppInfo;
        }

        let consumption = app[type];
        if (!consumption) {
            consumption = [];
        }

        if (consumption.includes(id)) {
            success = false;
            return app;
        }

        app[type] = [...consumption, id].sort((left, right) => left - right);
        request.log(app, "addAssignment", { type, id });

        return { ...app };
    });

    return { app, success };
}

export async function removeAssignment(appId: string, request: ALNinjaRequestContext, type: ALObjectType, id: number): Promise<UpdateResult> {
    let success = true;

    const blob = new Blob<AppInfo>(`${appId}.json`);
    const app = await blob.optimisticUpdate((app) => {
        if (!app) {
            app = {} as AppInfo;
            return app;
        }

        let consumption = app[type];
        if (!consumption || !consumption.includes(id)) {
            return app;
        }

        app[type] = consumption.filter(x => x !== id);
        request.log(app, "removeAssignment", { type, id });

        return { ...app };
    });

    return { app, success };
}
