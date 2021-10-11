import { Blob } from "@vjeko.com/azure-func";
import { getSha256 } from "../../../common/util";
import { AppInfo } from "../TypesV2";

const getBlob = (appId: string) => new Blob<AppInfo>(`${appId}.json`);

interface UpdateAppAuthorizationResult {
    app: AppInfo;
    success: boolean;
}

export async function writeAppAuthorization(appId: string): Promise<UpdateAppAuthorizationResult> {
    const key = getSha256(`APP_AUTH_${appId}_${Date.now()}`, "base64");
    const blob = getBlob(appId);
    const app = await blob.optimisticUpdate(app => {
        app = { ...(app || {} as AppInfo) }
        app._authorization = { key, valid: true };
        return app;
    });

    return { app, success: app._authorization.key && app._authorization.valid };
}

export async function removeAppAuthorization(appId: string): Promise<UpdateAppAuthorizationResult> {
    const blob = getBlob(appId);
    const app = await blob.optimisticUpdate(app => {
        delete app._authorization;
        return { ...app };
    });
    return { app, success: !app._authorization };
}
