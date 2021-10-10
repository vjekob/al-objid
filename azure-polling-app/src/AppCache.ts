import { Blob } from "@vjeko.com/azure-func";
import { AppInfo, AuthorizedAppInfo } from "./AppInfo";

class AppCache {
    private _apps: { [key: string]: AuthorizedAppInfo } = {};

    private readAppFromStorage(appId: string): Promise<AuthorizedAppInfo> {
        const blob = new Blob<AuthorizedAppInfo>(`${appId}.json`);
        return blob.read(true);
    }

    private stripAuthorization(appInfo: AuthorizedAppInfo): AppInfo {
        if (!appInfo) {
            return {} as AppInfo;
        }
        const { _authorization, _timestamp, ...rest } = appInfo;
        return rest;
    }

    private async cacheUnknownApp(appId: string): Promise<void> {
        const app = await this.readAppFromStorage(appId);
        this.updateCache(appId, app, Date.now());
    }

    private async getAuthorizedApp(appId: string): Promise<AuthorizedAppInfo> {
        if (!this._apps.hasOwnProperty[appId]) {
            await this.cacheUnknownApp(appId);
        }
        return this._apps[appId];
    }

    public updateCache(appId: string, app: AuthorizedAppInfo, timestamp: number): void {
        if (!app) {
            delete this._apps[appId];
            return;
        }
        if (!this._apps[appId] || this._apps[appId]._timestamp < timestamp) {
            this._apps[appId] = { ...app, _timestamp: timestamp };
        }
    }

    public async getApp(appId: string): Promise<AppInfo> {
        const app = await this.getAuthorizedApp(appId);
        return this.stripAuthorization(app);
    }

    public async isAuthorized(appId: string, authKey: string): Promise<boolean> {
        const app = await this.getAuthorizedApp(appId);
        return !app || !app._authorization || !app._authorization.valid || app._authorization.key === authKey;
    }
}

export default new AppCache();
