import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { run as createPool } from "../../src/functions/v2/createPool";
import { run as authorizeApp } from "../../src/functions/v2/authorizeApp";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { CreatePoolResponse } from "../../src/functions/v2/createPool/types";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();

describe("Testing function api/v2/authorizeApp (for managed pools)", () => {
    const name = "_mock_pool_";
    const managementSecret = "_mock_management_secret";
    const joinKey = "_mock_join_key_";

    async function createMockPool(storage, allowAnyAppToManage = false): Promise<CreatePoolResponse> {
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret, joinKey, allowAnyAppToManage }));
        await createPool(context, context.req);
        return context.res.body as CreatePoolResponse;
    }

    it("Fails authorizing a pool", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const context = new Mock.Context(new Mock.Request("POST", { appId: poolId, user: "fake" }));
        await authorizeApp(context, context.req);
        expect(context.res).toBeStatus(403);
        expect(storage).not.toBeAuthorized();
    });

    it("Fails de-authorizing a pool", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const context = new Mock.Context(new Mock.Request("DELETE", { appId: poolId, authKey: "__mock_2__", user: "fake" }));
        await authorizeApp(context, context.req);
        expect(context.res).toBeStatus(403);
        expect(storage).not.toBeAuthorized();
    });

    it("Succeds retrieving authorization state for a pool", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const contextGET = new Mock.Context(new Mock.Request("GET", { appId: poolId }));
        await authorizeApp(contextGET, contextGET.req);
        expect(contextGET.res).toBeStatus(200);
        expect(contextGET.res.body).toBeDefined();
        expect(contextGET.res.body.authorized).toStrictEqual(true);
    });
});
