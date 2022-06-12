import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { disableJoinPoolRateLimit, run as joinPool } from "../../src/functions/v2/joinPool";
import { disableCreatePoolRateLimit, run as createPool } from "../../src/functions/v2/createPool";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { CreatePoolResponse } from "../../src/functions/v2/createPool/types";
import { JoinPoolResponse } from "../../src/functions/v2/joinPool/types";
import { decrypt } from "../../src/common/Encryption";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();
disableCreatePoolRateLimit();
disableJoinPoolRateLimit();

describe("Testing function api/v2/joinPool", () => {
    const name = "_mock_pool_";
    const apps = [
        {
            appId: "id1",
            name: "app #1"
        },
        {
            appId: "id2",
            name: "app #2"
        },
    ];
    const managementSecret = "_mock_management_secret";
    const joinKey = "_mock_join_key_";

    async function createMockPool(storage: StubStorage, allowAnyAppToManage = false): Promise<CreatePoolResponse> {
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret, joinKey, allowAnyAppToManage }));
        await createPool(context, context.req);
        return context.res.body as CreatePoolResponse;
    }

    it("Fails joining pool with invalid info (missing body)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", {}));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails joining pool with invalid info (invalid poolId type)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { poolId: 3.14 }));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails joining pool with invalid info (invalid joinKey type)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_", joinKey: 3.14 }));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails joining pool with invalid info (missing apps)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_", joinKey: "_mock_key_" }));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails joining pool for a non-existent pool", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_", joinKey: "invalid", apps }));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(404);
    });

    it("Fails joining pool for a non-pool app", async () => {
        const storage = new StubStorage().app("_mock_");
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_", joinKey: "invalid", apps }));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(405);
    });

    it("Fails joining pool for an app that's already in the pool", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const context = new Mock.Context(new Mock.Request("POST", { poolId, joinKey, apps }));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(200);

        await joinPool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    
    it("Fails joining pool with invalid joinKey", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const context = new Mock.Context(new Mock.Request("POST", { poolId, joinKey: "invalid_key", apps }));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(401);
    });

    it("Succeeds joining pool with valid joinKey", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId, accessKey } = pool;
        const joinLockEncryptionKey = `${joinKey}${poolId}`.substring(0, 32);

        const { _pool } = storage.content[`${poolId}.json`];

        const context = new Mock.Context(new Mock.Request("POST", { poolId, joinKey, apps }));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(200);

        const join = context.res.body as JoinPoolResponse;
        expect(join.accessKey).toBeDefined();
        expect(join.accessKey).toStrictEqual(accessKey);
        expect(join.validationKey).toBeDefined();
        expect(join.validationKey).toStrictEqual(decrypt(_pool.validationKey.private, joinLockEncryptionKey));
        expect(join.managementKey).toBeUndefined();

        const app = storage.content[`${poolId}.json`];
        expect(app._pool).toBeDefined();
        expect(app._pool.info).toBeDefined();

        expect(join.leaveKeys).toBeDefined();
        for (let appInfo of apps) {
            expect(join.leaveKeys[appInfo.appId]).toBeDefined();
            expect(typeof join.leaveKeys[appInfo.appId]).toStrictEqual("string");
            expect(app._pool.leaveKeys[appInfo.appId]).toStrictEqual(join.leaveKeys[appInfo.appId]);
        }

        const info = JSON.parse(decrypt(app._pool.info, accessKey));
        expect(info.name).toStrictEqual(name);
        expect(info.apps.length).toStrictEqual(apps.length);
        expect(info.apps).toEqual(apps);
    });

    it("Succeeds joining pool with valid joinKey and allowAnyAppToManage set to true", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage, true);
        const { poolId, accessKey } = pool;
        const joinLockEncryptionKey = `${joinKey}${poolId}`.substring(0, 32);

        const { _pool } = storage.content[`${poolId}.json`];

        const context = new Mock.Context(new Mock.Request("POST", { poolId, joinKey, apps }));
        await joinPool(context, context.req);
        expect(context.res).toBeStatus(200);

        const join = context.res.body as JoinPoolResponse;
        expect(join.accessKey).toBeDefined();
        expect(join.accessKey).toStrictEqual(accessKey);
        expect(join.validationKey).toBeDefined();
        expect(join.validationKey).toStrictEqual(decrypt(_pool.validationKey.private, joinLockEncryptionKey));
        expect(join.managementKey).toBeDefined();

        const app = storage.content[`${poolId}.json`];
        expect(app._pool).toBeDefined();
        expect(app._pool.info).toBeDefined();

        const info = JSON.parse(decrypt(app._pool.info, accessKey));
        expect(info.name).toStrictEqual(name);
        expect(info.apps.length).toStrictEqual(apps.length);
        expect(info.apps).toEqual(apps);
    });

});
