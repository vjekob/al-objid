import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";
import getConsumption from "../../src/functions/v2/getConsumption";
import { run as createPool } from "../../src/functions/v2/createPool";
import { CreatePoolResponse } from "../../src/functions/v2/createPool/types";
import { createPrivateKey, createSign } from "crypto";


jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers()

describe("Testing function api/v2/getConsumption", () => {
    const invalidAppId = "_INVALID_APP_";
    const validAppId = "_VALID_APP_";
    const name = "_mock_pool_";
    const apps = [
        {
            appId: validAppId,
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
        const context = new Mock.Context(new Mock.Request("POST", { name, managementSecret, joinKey, apps, allowAnyAppToManage }));
        await createPool(context, context.req);
        return context.res.body as CreatePoolResponse;
    }

    it("Fails retrieving consumptions from a pool without signature", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        storage.setAppInspectionContext(poolId);
        storage.setConsumption(ALObjectType.codeunit, [1, 2, 3]);
        storage.setConsumption(ALObjectType.page, [4, 5, 6]);
        storage.setConsumption(storage.toALObjectType("table_2"), [7, 8]);

        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId }));
        await getConsumption(context, context.req);
        expect(context.res).toBeStatus(403);
        expect(context.res.body).toContain("Signature required");
    });

    it("Fails retrieving consumptions from a pool with invalid signature", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId } = pool;

        storage.setAppInspectionContext(poolId);
        storage.setConsumption(ALObjectType.codeunit, [1, 2, 3]);
        storage.setConsumption(ALObjectType.page, [4, 5, 6]);
        storage.setConsumption(storage.toALObjectType("table_2"), [7, 8]);

        const payload = { appId: poolId };
        const _payload = JSON.stringify(payload);
        const context = new Mock.Context(new Mock.Request("GET", { ...payload, _payload, _signature: "_invalid_" }));
        await getConsumption(context, context.req);
        expect(context.res).toBeStatus(403);
        expect(context.res.body).toContain("Invalid signature");
    });

    it("Fails retrieving consumption from a pool with valid signature, but missing _sourceAppId", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId, validationKey } = pool;

        storage.setAppInspectionContext(poolId);
        storage.setConsumption(ALObjectType.codeunit, [1, 2, 3]);
        storage.setConsumption(ALObjectType.page, [4, 5, 6]);
        storage.setConsumption(storage.toALObjectType("table_2"), [7, 8]);

        const payload = { appId: poolId };
        const _payload = JSON.stringify(payload);

        const privateKey = createPrivateKey({ key: Buffer.from(validationKey, "base64"), format: "der", type: "pkcs8" });
        const sign = createSign("RSA-SHA256");
        sign.write(_payload);
        sign.end();
        const _signature = sign.sign(privateKey, "base64");

        const context = new Mock.Context(new Mock.Request("GET", { ...payload, _payload, _signature }));
        await getConsumption(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails retrieving consumption from a pool with valid signature, but invalid _sourceAppId", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId, validationKey } = pool;

        storage.setAppInspectionContext(poolId);
        storage.setConsumption(ALObjectType.codeunit, [1, 2, 3]);
        storage.setConsumption(ALObjectType.page, [4, 5, 6]);
        storage.setConsumption(storage.toALObjectType("table_2"), [7, 8]);

        const payload = { appId: poolId };
        const _payload = JSON.stringify(payload);

        const privateKey = createPrivateKey({ key: Buffer.from(validationKey, "base64"), format: "der", type: "pkcs8" });
        const sign = createSign("RSA-SHA256");
        sign.write(_payload);
        sign.end();
        const _signature = sign.sign(privateKey, "base64");

        const context = new Mock.Context(new Mock.Request("GET", { ...payload, _payload, _signature, _sourceAppId: invalidAppId }));
        await getConsumption(context, context.req);
        expect(context.res).toBeStatus(403);
    });

    it("Succeeds retrieving consumptions from a pool with valid signature and valid _sourceAppId", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const pool = await createMockPool(storage);
        const { poolId, validationKey } = pool;

        storage.setAppInspectionContext(poolId);
        storage.setConsumption(ALObjectType.codeunit, [1, 2, 3]);
        storage.setConsumption(ALObjectType.page, [4, 5, 6]);
        storage.setConsumption(storage.toALObjectType("table_2"), [7, 8]);

        const payload = { appId: poolId };
        const _payload = JSON.stringify(payload);

        const privateKey = createPrivateKey({ key: Buffer.from(validationKey, "base64"), format: "der", type: "pkcs8" });
        const sign = createSign("RSA-SHA256");
        sign.write(_payload);
        sign.end();
        const _signature = sign.sign(privateKey, "base64");

        const context = new Mock.Context(new Mock.Request("GET", { ...payload, _payload, _signature, _sourceAppId: validAppId }));
        await getConsumption(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body._total).toStrictEqual(6);
        expect(context.res.body.codeunit).toEqual([1, 2, 3]);
        expect(context.res.body.page).toEqual([4, 5, 6]);
        expect(context.res.body[storage.toALObjectType("table_2")]).toEqual([7, 8]);
    });
});
