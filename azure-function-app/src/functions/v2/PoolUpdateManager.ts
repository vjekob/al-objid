import { Blob, ErrorResponse } from "@vjeko.com/azure-func";
import { randomBytes } from "crypto";
import { decrypt, encrypt } from "../../common/Encryption";
import { JoinPoolResponse } from "./joinPool/types";
import { LeavePoolAppInfo } from "./leavePool/types";
import { AppInfo, PoolAppInfo, PoolInfo } from "./TypesV2";

export class PoolUpdateManager {
    private readonly _poolId: string;
    private readonly _blob: Blob<AppInfo>;
    private _app: AppInfo;

    private constructor(poolId: string) {
        this._poolId = poolId;
        this._blob = new Blob<AppInfo>(`${poolId}.json`);
    }

    private async preValidate() {
        let app: AppInfo;
        try {
            app = await this._blob.read();
            if (!app) {
                throw null;
            }
            this._app = app;
        } catch {
            throw new ErrorResponse(`Pool ${this._poolId} does not exist.`, 404);
        }

        if (!app._pool) {
            throw new ErrorResponse(`App ${this._poolId} is not a managed pool.`, 405);
        }
    }

    public static async create(poolId: string) {
        const handler = new PoolUpdateManager(poolId);
        await handler.preValidate();
        return handler;
    }

    public get blob() {
        return this._blob;
    }

    public get pool() {
        return this._app._pool;
    }

    private retrievePoolInfo(accessKey: string): PoolInfo {
        const infoDecrypted = decrypt(this._app._pool.info, accessKey);
        if (!infoDecrypted) {
            throw new ErrorResponse(`Stale access key for pool ${this._poolId}. Please, ask the administrator to regenerate the join key.`, 401);
        };

        try {
            return JSON.parse(infoDecrypted) as PoolInfo;
        } catch {
            throw new ErrorResponse("Invalid pool info content, you should not really see this error", 406);
        }
    }

    private decryptPoolInfo(joinKey: string): [PoolInfo, string, string] {
        const joinLockEncryptionKey = `${joinKey}${this._poolId}`.substring(0, 32);
        const { joinLock } = this._app._pool;
        const joinLockDecrypted = decrypt(joinLock, joinLockEncryptionKey);

        if (!joinLockDecrypted) {
            throw new ErrorResponse(`Invalid join key for pool ${this._poolId}.`, 401);
        }

        const accessKey = joinLockDecrypted.substring(64);
        return [this.retrievePoolInfo(accessKey), accessKey, joinLockEncryptionKey];

    }

    public async join(joinKey: string, apps: PoolAppInfo[]): Promise<JoinPoolResponse> {
        const [info, accessKey, joinLockEncryptionKey] = this.decryptPoolInfo(joinKey);

        for (let appNew of apps) {
            if (info.apps.some(app => app.appId === appNew.appId) || this._app._pool.appIds.includes(appNew.appId)) {
                throw new ErrorResponse(`App ${appNew.appId} is already included in pool ${this._poolId}`, 400);
            }
        }

        info.apps.push(...apps);
        const appIds: string[] = (this._app._pool.appIds || []);
        appIds.push(...apps.map(app => app.appId));

        const leaveKeys = apps.reduce((leaveKeys, app) => {
            leaveKeys[app.appId] = randomBytes(64).toString("base64");
            return leaveKeys;
        }, {});

        await this._blob.optimisticUpdate(app => {
            app._pool.info = encrypt(JSON.stringify(info), accessKey);
            app._pool.appIds = appIds;
            app._pool.leaveKeys = leaveKeys;
            return { ...app };
        });

        const validationKey = decrypt(this._app._pool.validationKey.private, joinLockEncryptionKey);
        return {
            accessKey,
            validationKey,
            managementKey: this._app._pool.managementKey.private,
            leaveKeys
        };
    }

    private makeSureAppsInPool(info: PoolInfo, apps: PoolAppInfo[]): void {
        for (let appInfo of apps) {
            if (!this._app._pool.appIds.includes(appInfo.appId)) {
                throw new ErrorResponse(`App ${appInfo.appId} is not in this pool`, 409);
            }
        }
    }

    private async removeAppsFromPool(accessKey: string, info: PoolInfo, apps: PoolAppInfo[]): Promise<void> {
        info.apps = info.apps.filter(app => !apps.some(leaveApp => leaveApp.appId === app.appId));
        const appIds = this._app._pool.appIds.filter(id => !apps.some(app => app.appId === id));
        const leaveKeys = this._app._pool.leaveKeys;
        for (let app of apps) {
            delete leaveKeys[app.appId];
        }
        await this._blob.optimisticUpdate(app => {
            app._pool.info = encrypt(JSON.stringify(info), accessKey);
            app._pool.appIds = appIds;
            app._pool.leaveKeys = leaveKeys
            return { ...app };
        });
    }

    public async leave(accessKey: string, apps: LeavePoolAppInfo[]): Promise<void> {
        const info = this.retrievePoolInfo(accessKey);
        this.makeSureAppsInPool(info, apps);
        for (let appInfo of apps) {
            if (this._app._pool.leaveKeys[appInfo.appId] !== appInfo.leaveKey) {
                throw new ErrorResponse(`Invalid leave key provided for app ${appInfo.appId}`, 403);
            }
        }
        await this.removeAppsFromPool(accessKey, info, apps);

    }

    public async remove(accessKey: string, apps: PoolAppInfo[]): Promise<void> {
        const info = this.retrievePoolInfo(accessKey);
        this.makeSureAppsInPool(info, apps);
        await this.removeAppsFromPool(accessKey, info, apps);
    }

    public async rename(accessKey: string, name: string): Promise<void> {
        const info = this.retrievePoolInfo(accessKey);
        info.name = name;
        await this._blob.optimisticUpdate(app => {
            app._pool.info = encrypt(JSON.stringify(info), accessKey);
            return { ...app };
        });
    }

    public async removePool(deleteBlob: boolean): Promise<void> {
        if (deleteBlob) {
            await this._blob.delete();
            return;
        }

        await this._blob.optimisticUpdate(app => {
            const { _pool, ...rest } = app;
            return {...rest} as AppInfo;
        })
    }
}
