import { Blob } from "@vjeko.com/azure-func";
import { getSha256 } from "../../../common/util";
import { ALNinjaRequestContext, AppInfo } from "../TypesV2";

const getBlob = (appId: string) => new Blob<AppInfo>(`${appId}.json`);

interface UpdateAppAuthorizationResult {
    app: AppInfo;
    success: boolean;
}

export async function writeAppAuthorization(appId: string, gitUser: string, gitEMail: string, request: ALNinjaRequestContext): Promise<UpdateAppAuthorizationResult> {
    const key = getSha256(`APP_AUTH_${appId}_${Date.now()}`, "base64");
    const blob = getBlob(appId);
    const app = await blob.optimisticUpdate(app => {
        app = { ...(app || {} as AppInfo) }
        app._authorization = {
            key,
            valid: true,
            user: {
                timestamp: Date.now(),
            } as any,
        };
        if (gitUser) {
            app._authorization.user.name = gitUser;
            if (gitEMail) {
                app._authorization.user.email = gitEMail;
            }
        }

        request.log(app, "authorize");

        return app;
    });

    return { app, success: app._authorization.key && app._authorization.valid };
}

export async function removeAppAuthorization(appId: string, request: ALNinjaRequestContext): Promise<UpdateAppAuthorizationResult> {
    const blob = getBlob(appId);
    const app = await blob.optimisticUpdate(app => {
        delete app._authorization;

        request.log(app, "deauthorize");

        return { ...app };
    });
    return { app, success: !app._authorization };
}
