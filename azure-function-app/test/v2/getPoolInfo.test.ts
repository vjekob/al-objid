import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import getPoolInfo from "../../src/functions/v2/getPoolInfo";
import { run as createPool } from "../../src/functions/v2/createPool";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { CreatePoolResponse } from "../../src/functions/v2/createPool/types";
import { GetPoolInfoResponse } from "../../src/functions/v2/getPoolInfo/types";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();

describe("Testing function api/v2/getPoolInfo", () => {
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

    async function createMockPool(storage): Promise<CreatePoolResponse> {
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret: "managementSecret", joinKey: "joinKey", apps }));
        await createPool(context, context.req);
        return context.res.body as CreatePoolResponse;
    }

    it("Fails getting pool info with invalid info (missing body)", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", {}));
        await getPoolInfo(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails getting pool info with invalid info (missing accessKey )", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { poolId: "_mock_" }));
        await getPoolInfo(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails getting pool info with invalid info (invalid poolId )", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { poolId: 3.14 }));
        await getPoolInfo(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails getting pool info with invalid info (invalid accessKey )", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { poolId: "_mock_", accessKey: 3.14 }));
        await getPoolInfo(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails getting pool info for unknown pool", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { poolId: "_mock_", accessKey: "_mock_key_" }));
        await getPoolInfo(context, context.req);
        expect(context.res).toBeStatus(404);
    });

    it("Fails getting pool info for a known non-pool app", async () => {
        const storage = new StubStorage().app("_mock_");
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { poolId: "_mock_", accessKey: "_mock_key_" }));
        await getPoolInfo(context, context.req);
        expect(context.res).toBeStatus(405);
    });

    it("Succeeds getting pool info for known pool", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);

        const { poolId, accessKey } = pool;

        const context = new Mock.Context(new Mock.Request("GET", { poolId, accessKey }));
        await getPoolInfo(context, context.req);
        expect(context.res).toBeStatus(200);

        const info = context.res.body as GetPoolInfoResponse;
        expect(info.name).toStrictEqual(name);
        expect(info.apps).toEqual(apps);
    });

    it("Fails getting pool info for known pool with invalid access key", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);

        const { poolId } = pool;

        const context = new Mock.Context(new Mock.Request("GET", { poolId, accessKey: "invalid" }));
        await getPoolInfo(context, context.req);
        expect(context.res).toBeStatus(401);
    });
});
