import { Blob } from "@vjeko.com/azure-func";
import { getSha256 } from "../../../common/util";
import { AppCache } from "../TypesV2";

const getBlob = (appId: string) => new Blob<AppCache>(`${appId}.json`);

export async function writeAppAuthorization(appId: string): Promise<string> {
    const key = getSha256(`APP_AUTH_${appId}_${Date.now()}`, "base64");
    const blob = getBlob(appId);
    const result = await blob.optimisticUpdate(app => {
        app = { ...(app || {} as AppCache) }
        app._authorization = { key, valid: true };
        return app;
    });

    return result._authorization.key;
}

export async function removeAppAuthorization(appId: string): Promise<boolean> {
    const blob = getBlob(appId);
    const result = await blob.optimisticUpdate(app => {
        delete app._authorization;
        return { ...app };
    });
    return !result._authorization;
}
