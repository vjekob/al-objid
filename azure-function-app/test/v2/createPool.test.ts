import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { run as createPool, disableCreatePoolRateLimit } from "../../src/functions/v2/createPool";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { decrypt } from "../../src/common/Encryption";


jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();
disableCreatePoolRateLimit();

describe("Testing function api/v2/createPool", () => {

    it("Fails creating pool with invalid info (missing body)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", {}));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails creating pool with invalid info (missing name)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name: " " }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(400);
        expect(context.res.body.errorMessage).toContain(`"name"`);
        expect(context.res.body.errorMessage).toContain(`must be defined`);
    });

    it("Fails creating pool with invalid info (missing managementSecret)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name: "name", managementSecret: " " }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(400);
        expect(context.res.body.errorMessage).toContain(`"managementSecret"`);
        expect(context.res.body.errorMessage).toContain(`must be defined`);
    });

    it("Fails creating pool with invalid info (missing joinKey)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name: "name", managementSecret: "managementSecret", joinKey: " " }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(400);
        expect(context.res.body.errorMessage).toContain(`"joinKey"`);
        expect(context.res.body.errorMessage).toContain(`must be defined`);
    });
    
    it("Fails creating pool with invalid apps provided (missing appId)", async () => {
        const name = "_mock_pool_";
        const apps = [
            {
                id: "id1",
                Name: "app #1"
            },
            {
                id: "id2",
                Name: "app #2"
            },
        ];

        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret: "managementSecret", joinKey: "joinKey", apps }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(400);
        expect(context.res.body.errorMessage).toContain(`appId`);
        expect(context.res.body.errorMessage).toContain(`must be "string"`);
    });
    
    it("Fails creating pool with invalid apps provided (invalid appId)", async () => {
        const name = "_mock_pool_";
        const apps = [
            {
                appId: false,
                Name: "app #1"
            },
            {
                appId: false,
                Name: "app #2"
            },
        ];

        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret: "managementSecret", joinKey: "joinKey", apps }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(400);
        expect(context.res.body.errorMessage).toContain(`appId`);
        expect(context.res.body.errorMessage).toContain(`must be "string"`);
    });
    
    it("Fails creating pool with invalid apps provided (missing name)", async () => {
        const name = "_mock_pool_";
        const apps = [
            {
                appId: "app1",
                Name: "app #1"
            },
            {
                appId: "app2",
                Name: "app #2"
            },
        ];

        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret: "managementSecret", joinKey: "joinKey", apps }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(400);
        expect(context.res.body.errorMessage).toContain(`name`);
        expect(context.res.body.errorMessage).toContain(`must be "string"`);
    });
    
    it("Fails creating pool with invalid apps provided (invalid name)", async () => {
        const name = "_mock_pool_";
        const apps = [
            {
                appId: "app1",
                name: 3.14
            },
            {
                appId: "app2",
                name: 3.141
            },
        ];

        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret: "managementSecret", joinKey: "joinKey", apps }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(400);
        expect(context.res.body.errorMessage).toContain(`name`);
        expect(context.res.body.errorMessage).toContain(`must be "string"`);
    });

    it("Succeeds creating pool with minimum info provided", async () => {
        const name = "_mock_pool_";
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret: "managementSecret", joinKey: "joinKey" }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).not.toBeAuthorized();

        expect(context.res.body.poolId).toBeDefined();
        expect(context.res.body.managementKey).toBeDefined();
        expect(context.res.body.accessKey).toBeDefined();

        const { poolId, accessKey } = context.res.body;
        const app = storage.content[`${poolId}.json`];
        expect(app).toBeDefined();
        const { _pool } = app;
        expect(_pool.appIds).toBeDefined();
        expect(_pool.appIds.length).toStrictEqual(0);
        expect(_pool.info).toBeDefined();
        expect(typeof _pool.info).toStrictEqual("string");
        expect(_pool.joinLock).toBeDefined();
        expect(typeof _pool.joinLock).toStrictEqual("string");
        expect(_pool.managementKey).toBeDefined();
        expect(_pool.managementKey.public).toBeDefined();
        expect(_pool.managementKey.private).not.toBeDefined();
        expect(_pool.appIds).toBeDefined();
        expect(_pool.appIds.length).toStrictEqual(0);

        const info = JSON.parse(decrypt(_pool.info, accessKey));
        expect(info.name).toStrictEqual(name);
        expect(info.apps).toBeDefined();
        expect(info.apps.length).toStrictEqual(0);
    });

    it("Succeeds creating pool with management access for all apps", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name: "name", managementSecret: "managementSecret", joinKey: "joinKey", allowAnyAppToManage: true }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).not.toBeAuthorized();

        const { poolId } = context.res.body;
        const app = storage.content[`${poolId}.json`];
        const { _pool } = app;
        expect(_pool.managementKey.private).toBeDefined();
    });
    
    it("Succeeds creating pool with apps provided", async () => {
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

        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret: "managementSecret", joinKey: "joinKey", apps }));
        await createPool(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();

        const { poolId, accessKey } = context.res.body;
        const app = storage.content[`${poolId}.json`];
        expect(app).toBeDefined();
        const { _pool } = app;
        expect(_pool.appIds).toBeDefined();
        expect(_pool.appIds.length).toStrictEqual(2);

        const info = JSON.parse(decrypt(_pool.info, accessKey));
        expect(info.name).toStrictEqual(name);
        expect(info.apps).toBeDefined();
        expect(info.apps.length).toStrictEqual(2);
        expect(info.apps).toEqual(apps);
    });
});
