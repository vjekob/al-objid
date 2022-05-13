import { output } from "../../features/Output";
import { CheckResponse } from "./CheckResponse";
import { ConsumptionInfoWithTotal } from "../types/ConsumptionInfoWithTotal";
import { AuthorizedAppConsumption } from "./AuthorizedAppConsumption";
import { FolderAuthorization } from "./FolderAuthorization";
import { AuthorizationDeletedInfo } from "./AuthorizationDeletedInfo";
import { AuthorizedAppResponse } from "./AuthorizedAppResponse";
import { AuthorizationInfo } from "./AuthorizationInfo";
import { ConsumptionInfo } from "../types/ConsumptionInfo";
import { NextObjectIdInfo } from "../types/NextObjectIdInfo";
import { Config } from "../Config";
import { UI } from "../UI";
import { API_RESULT, LABELS } from "../constants";
import { env, Uri } from "vscode";
import { Telemetry } from "../Telemetry";
import { getRangeForId } from "../functions/getRangeForId";
import { BackEndAppInfo } from "./BackEndAppInfo";
import { NinjaALRange } from "../types/NinjaALRange";
import { ALRange } from "../types/ALRange";
import { ALApp } from "../ALApp";
import { WorkspaceManager } from "../../features/WorkspaceManager";
import { HttpErrorHandler } from "./HttpErrorHandler";
import { HttpEndpoints } from "./HttpEndpoints";
import { sendRequest } from "./sendRequest";
import { PropertyBag } from "../types/PropertyBag";

(async () => {
    if (Config.instance.isBackEndConfigInError) {
        if ((await UI.general.showBackEndConfigurationError()) === LABELS.BUTTON_LEARN_MORE) {
            env.openExternal(Uri.parse("https://github.com/vjekob/al-objid/blob/master/doc/DeployingBackEnd.md"));
        }
    }
})();

export class Backend {
    private static readonly _knownManagedApps: PropertyBag<Promise<boolean> | undefined> = {};

    /**
     * Checks if an app is a known managed app. A managed app is an app that Ninja's back end is aware of and Ninja
     * can use that app to manage object ID assignment.
     * @param appId App hash to check
     * @param forceCheck Specifies whether back-end lookup will be performed
     * @returns Promise to boolean result. When false, the app is not managed, and calls for it should not be made.
     */
    private static async isKnownManagedApp(appId: string, forceCheck: boolean = false): Promise<boolean> {
        if (!this._knownManagedApps[appId]) {
            if (!forceCheck) {
                return false;
            }
            return await (this._knownManagedApps[appId] = Backend.checkApp(appId));
        }

        return await this._knownManagedApps[appId]!;
    }

    /**
     * Marks the local app as known managed app.
     * @param appHash App hash to remember.
     */
    private static rememberManagedApp(appHash: string) {
        this._knownManagedApps[appHash] = Promise.resolve(true);
    }

    public static async getNextNo(
        app: ALApp,
        type: string,
        ranges: ALRange[],
        commit: boolean,
        require?: number
    ): Promise<NextObjectIdInfo | undefined> {
        if (!(await this.isKnownManagedApp(app.hash))) {
            if (!commit) {
                this.rememberManagedApp(app.hash);
            }
        }

        const additionalOptions = {} as NextObjectIdInfo;
        const idRanges = app.config.getObjectTypeRanges(type);
        if (Config.instance.requestPerRange || idRanges.length > 0) {
            additionalOptions.perRange = true;
            if (commit && require) {
                additionalOptions.require = require;
            }
            if (idRanges.length > 0) {
                ranges = idRanges;
                if (commit && require) {
                    // When committing, and we use logical ranges, then filter out the ranges to only the same logical range (identified by name)
                    const currentRange = getRangeForId(require, ranges as NinjaALRange[]);
                    if (currentRange) {
                        ranges = (ranges as NinjaALRange[]).filter(range =>
                            currentRange.description ? range.description === currentRange.description : true
                        );
                    }
                }
            }
        }

        const appId = WorkspaceManager.instance.getPoolIdFromAppIdIfAvailable(app.hash);

        const response = await sendRequest<NextObjectIdInfo>("/api/v2/getNext", commit ? "POST" : "GET", {
            appId,
            type,
            ranges,
            authKey: app.config.authKey,
            ...additionalOptions,
        });
        if (response.status === API_RESULT.SUCCESS)
            output.log(`Received next ${type} ID response: ${JSON.stringify(response.value)}`);
        return response.value;
    }

    public static async syncIds(app: BackEndAppInfo, ids: ConsumptionInfo, patch: boolean): Promise<boolean> {
        this.rememberManagedApp(app.hash);

        const appId = WorkspaceManager.instance.getPoolIdFromAppIdIfAvailable(app.hash);

        const response = await sendRequest<ConsumptionInfo>("/api/v2/syncIds", patch ? "PATCH" : "POST", {
            appId,
            ids,
            authKey: app.authKey,
        });
        return !!response.value;
    }

    public static async autoSyncIds(consumptions: AuthorizedAppConsumption[], patch: boolean): Promise<boolean> {
        consumptions = JSON.parse(JSON.stringify(consumptions)); // Cloning to avoid side effects

        for (let app of consumptions) {
            this.rememberManagedApp(app.appId);
            app.appId = WorkspaceManager.instance.getPoolIdFromAppIdIfAvailable(app.appId);
        }
        const response = await sendRequest<ConsumptionInfo>("/api/v2/autoSyncIds", patch ? "PATCH" : "POST", {
            appFolders: consumptions,
        });
        return !!response.value;
    }

    public static async authorizeApp(
        app: BackEndAppInfo,
        gitUser: string,
        gitEMail: string,
        errorHandler: HttpErrorHandler<AuthorizationInfo>
    ): Promise<AuthorizationInfo | undefined> {
        this.rememberManagedApp(app.hash);
        const additional: any = {};

        if (Config.instance.includeUserName) {
            additional.gitUser = app.encrypt(gitUser);
            additional.gitEMail = app.encrypt(gitEMail);
        }

        const appId = WorkspaceManager.instance.getPoolIdFromAppIdIfAvailable(app.hash);

        const response = await sendRequest<AuthorizationInfo>(
            "/api/v2/authorizeApp",
            "POST",
            {
                appId,
                ...additional,
            },
            errorHandler
        );
        return response.value;
    }

    public static async getAuthInfo(app: BackEndAppInfo, authKey: string): Promise<AuthorizedAppResponse | undefined> {
        // If the app is known to not be managed by the back end, then we exit
        if (!(await this.isKnownManagedApp(app.hash, true))) {
            return;
        }

        const appId = WorkspaceManager.instance.getPoolIdFromAppIdIfAvailable(app.hash);

        const response = await sendRequest<AuthorizedAppResponse>("/api/v2/authorizeApp", "GET", {
            appId,
            authKey,
        });
        const result = response.value;
        if (result && result.user) {
            result.user.name = app.decrypt(result.user.name) || "";
            result.user.email = app.decrypt(result.user.email) || "";
        }
        return result;
    }

    public static async deauthorizeApp(
        app: BackEndAppInfo,
        errorHandler: HttpErrorHandler<AuthorizationDeletedInfo>
    ): Promise<boolean> {
        const appId = WorkspaceManager.instance.getPoolIdFromAppIdIfAvailable(app.hash);
        const response = await sendRequest<AuthorizationDeletedInfo>(
            "/api/v2/authorizeApp",
            "DELETE",
            { appId, authKey: app.authKey },
            errorHandler
        );
        return typeof response.value === "object" && response.value.deleted;
    }

    public static async check(payload: FolderAuthorization[]): Promise<CheckResponse | undefined> {
        payload = JSON.parse(JSON.stringify(payload)); // Cloning to avoid side effects

        // We are not calling the polling endpoint if it's misconfigured. Either both URLs are default, or polling is pointless.
        if (Config.instance.isBackEndConfigInError) {
            Telemetry.instance.logOnce("invalidBackendConfig");
            return;
        }

        // Are app IDs known?
        const actualPayload: FolderAuthorization[] = [];
        const promises: Promise<boolean>[] = [];
        for (let folder of payload) {
            let knownApp = this._knownManagedApps[folder.appId];
            if (knownApp) {
                if (await knownApp) {
                    actualPayload.push(folder);
                }
                continue;
            }

            promises.push(
                ((appFolder: FolderAuthorization) => {
                    const checkApp = this.isKnownManagedApp(appFolder.appId, true);
                    checkApp.then(result => result && actualPayload.push(appFolder));
                    return checkApp;
                })(folder)
            );
        }

        // Let's await on any pending promises
        await Promise.all(promises);

        // If we have no apps to check, we exit
        if (actualPayload.length === 0) {
            return;
        }

        // Update payload for app pools
        for (let folder of payload) {
            folder.appId = WorkspaceManager.instance.getPoolIdFromAppIdIfAvailable(folder.appId);
        }

        // We check only those apps that we know are managed by the back end
        const response = await sendRequest<CheckResponse>(
            "/api/v2/check",
            "GET",
            actualPayload,
            async () => true, // On error, do nothing (message is logged in the output already)
            HttpEndpoints.polling
        );
        return response.value;
    }

    public static async getConsumption(app: BackEndAppInfo): Promise<ConsumptionInfoWithTotal | undefined> {
        if (!(await this.isKnownManagedApp(app.hash))) {
            return;
        }

        const appId = WorkspaceManager.instance.getPoolIdFromAppIdIfAvailable(app.hash);

        const response = await sendRequest<ConsumptionInfoWithTotal>("/api/v2/getConsumption", "GET", {
            appId,
            authKey: app.authKey,
        });
        return response.value;
    }

    public static async checkApp(appId: string): Promise<boolean> {
        appId = WorkspaceManager.instance.getPoolIdFromAppIdIfAvailable(appId);

        const response = await sendRequest<boolean>("/api/v2/checkApp", "GET", { appId });
        return response.value ?? false;
    }

    public static async telemetry(appSha: string | undefined, userSha: string, event: string, context?: any) {
        if (appSha && !(await this.isKnownManagedApp(appSha))) {
            // No telemetry is logged for non-managed apps
            return;
        }

        sendRequest<undefined>(
            "/api/telemetry",
            "POST",
            {
                ownEndpoints: !Config.instance.isDefaultBackEndConfiguration,
                userSha,
                appSha,
                event,
                context,
            },
            async () => true,
            HttpEndpoints.telemetry
        );
    }
}
