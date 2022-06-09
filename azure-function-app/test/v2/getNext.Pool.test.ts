import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { disableGetNextRateLimit, run as getNext} from "../../src/functions/v2/getNext";
import { run as createPool } from "../../src/functions/v2/createPool";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";
import { Range } from "../../src/functions/v2/TypesV2";
import { CreatePoolResponse } from "../../src/functions/v2/createPool/types";
import { createPrivateKey, createSign } from "crypto";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();
disableGetNextRateLimit();

describe("Testing function api/v2/getNext", () => {
    const ranges: Range[] = [{ from: 50000, to: 50009 }];
    const rangesMulti: Range[] = [{ from: 50000, to: 50009 }, {from: 60000, to: 60009}];

    const name = "_mock_pool_";
    const managementSecret = "_mock_management_secret";
    const joinKey = "_mock_join_key_";

    async function createMockPool(storage, allowAnyAppToManage = false): Promise<CreatePoolResponse> {
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret, joinKey, allowAnyAppToManage }));
        await createPool(context, context.req);
        return context.res.body as CreatePoolResponse;
    }

    it("Fails getting next ID from a known pool without signature", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const type = ALObjectType.codeunit;
        const context = new Mock.Context(new Mock.Request("GET", { appId: poolId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(403);
        expect(context.res.body).toContain("Signature required");
    });

    it("Fails getting next ID from a known pool with invalid signature", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        const type = ALObjectType.codeunit;
        const payload = { appId: poolId, ranges, type };
        const context = new Mock.Context(new Mock.Request("GET", { ...payload, _payload: JSON.stringify(payload), _signature: "_invalid_" }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(403);
        expect(context.res.body).toContain("Invalid signature");
    });

    it("Succeeds getting next ID from a known pool with valid signature", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId, validationKey } = pool;

        const type = ALObjectType.codeunit;
        const payload = { appId: poolId, ranges, type };
        const _payload = JSON.stringify(payload);

        const privateKey = createPrivateKey({ key: Buffer.from(validationKey, "base64"), format: "der", type: "pkcs8" });
        const sign = createSign("RSA-SHA256");
        sign.write(_payload);
        sign.end();
        const _signature = sign.sign(privateKey, "base64");
        const context = new Mock.Context(new Mock.Request("GET", { ...payload, _payload, _signature }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
    });
});
