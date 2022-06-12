import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { disableRemovePoolRateLimit, run as removePool } from "../../src/functions/v2/removePool";
import { disableCreatePoolRateLimit, run as createPool } from "../../src/functions/v2/createPool";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { CreatePoolResponse } from "../../src/functions/v2/createPool/types";
import { decrypt } from "../../src/common/Encryption";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();
disableCreatePoolRateLimit();
disableRemovePoolRateLimit();

describe("Testing function api/v2/removePool", () => {
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

    it("Fails removing pool with invalid info (missing body)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", {}));
        await removePool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails removing pool with invalid info (invalid poolId type)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { poolId: 3.14 }));
        await removePool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails removing pool with invalid info (invalid deleteBlob type)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_", deleteBlob: 3.14 }));
        await removePool(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails removing a non-existent pool", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_" }));
        await removePool(context, context.req);
        expect(context.res).toBeStatus(404);
    });

    it("Fails removing pool for a non-pool app", async () => {
        const storage = new StubStorage().app("_mock_");
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { poolId: "_mock_" }));
        await removePool(context, context.req);
        expect(context.res).toBeStatus(405);
    });

    it("Succeeds removing pool with keeping blob", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const context = new Mock.Context(new Mock.Request("POST", { poolId }));
        await removePool(context, context.req);
        expect(context.res).toBeStatus(200);

        const app = storage.content[`${poolId}.json`];
        expect(app._pool).not.toBeDefined();
    });


    it("Succeeds removing pool with deleting blob", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const context = new Mock.Context(new Mock.Request("POST", { poolId, deleteBlob: true }));
        await removePool(context, context.req);
        expect(context.res).toBeStatus(200);

        const app = storage.content[`${poolId}.json`];
        expect(app).not.toBeDefined();
    });
});
