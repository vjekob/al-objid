import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { disableRenamePoolRateLimit, run as renamePool } from "../../src/functions/v2/renamePool";
import { disableCreatePoolRateLimit, run as createPool } from "../../src/functions/v2/createPool";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { CreatePoolResponse } from "../../src/functions/v2/createPool/types";
import { decrypt } from "../../src/common/Encryption";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();
disableCreatePoolRateLimit();
disableRenamePoolRateLimit();

describe("Testing function api/v2/renamePool", () => {
    const name = "_mock_pool_";
    const newName = "_new_name_";
    const managementSecret = "_mock_management_secret";
    const joinKey = "_mock_join_key_";

    async function createMockPool(storage: StubStorage): Promise<CreatePoolResponse> {
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret, joinKey }));
        await createPool(context, context.req);
        return context.res.body as CreatePoolResponse;
    }

    it("Fails renaming pool with invalid info (missing body)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", {}));
        await renamePool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails renaming pool with invalid info (invalid poolId type)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { poolId: 3.14 }));
        await renamePool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails renaming pool with invalid info (invalid accessKey type)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_", accessKey: 3.14 }));
        await renamePool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails renaming pool with invalid info (missing name)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_", accessKey: "_mock_key_" }));
        await renamePool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails renaming pool for a non-existent pool", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_", accessKey: "invalid", name: newName }));
        await renamePool(context, context.req);
        expect(context.res).toBeStatus(404);
    });

    it("Fails renaming pool for a non-pool app", async () => {
        const storage = new StubStorage().app("_mock_");
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_", accessKey: "invalid", name: newName }));
        await renamePool(context, context.req);
        expect(context.res).toBeStatus(405);
    });

    it("Fails renaming pool with invalid accessKey", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const context = new Mock.Context(new Mock.Request("POST", { poolId, accessKey: "invalid_key", name: newName }));
        await renamePool(context, context.req);
        expect(context.res).toBeStatus(401);
    });

    it("Succeeds renaming pool with valid accessKey", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId, accessKey } = pool;

        const context = new Mock.Context(new Mock.Request("POST", { poolId, accessKey, name: newName }));
        await renamePool(context, context.req);
        expect(context.res).toBeStatus(200);

        const app = storage.content[`${poolId}.json`];
        expect(app._pool).toBeDefined();
        expect(app._pool.info).toBeDefined();

        const info = JSON.parse(decrypt(app._pool.info, accessKey));
        expect(info.name).toStrictEqual(newName);
    });

});
