import { ALObjectType } from "../../src/functions/v2/ALObjectType";
import { AzureTestLibrary } from "../AzureTestLibrary";

jest.mock("azure-storage");

describe("Testing function api/v1/getNext", () => {
    const azureFunction = new AzureTestLibrary.Fake.AzureFunction("../src/functions/v1/getNext");

    it("Fails on missing appId", async () => {
        AzureTestLibrary.Fake.useStorage({});
        const response = await azureFunction.invoke("GET");
        expect(response).toBeStatus(400);
        expect(response.body).toBe(`Missing property: appId`);
    });

    it("Fails on missing authorization", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("GET", { appId: storage.appId });
        expect(response).toBeStatus(401);
    });

    it("Fails on missing type", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("GET", { appId: storage.appId, authKey: storage.authKey });
        expect(response).toBeStatus(400);
        expect(response.body).toBe(`Missing property: type`);
    });

    it("Fails on missing ranges", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("GET", { appId: storage.appId, authKey: storage.authKey, type: "codeunit" });
        expect(response).toBeStatus(400);
        expect(response.body).toBe(`Missing property: ranges`);
    });

    it("Fails on invalid type", async () => {
        const type = "fake";
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("GET", { appId: storage.appId, authKey: storage.authKey, type, ranges: [{ from: 50000, to: 50009 }] });
        expect(response).toBeStatus(400);
        expect(response.body).toBe(`Invalid object type: ${type}`);
    });

    it("Succeeds getting next ID without previous consumption", async () => {
        const type = ALObjectType.codeunit;
        const ranges = [{ from: 50000, to: 50009 }];
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const bindings = {};
        const response = await azureFunction.invoke("GET", { appId: storage.appId, authKey: storage.authKey, type, ranges }, bindings);
        expect(response).toBeStatus(200);
        expect(response.body.id).toStrictEqual(50000);
        expect(response.body.available).toStrictEqual(true);
        expect(response.body.hasConsumption).toStrictEqual(false);
        expect(response.body.updated).toStrictEqual(false);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(expect.objectContaining(ranges));
        expect(storage).not.toHaveConsumption(type);
    });

    it("Succeeds getting next ID with previous consumption", async () => {
        const type = ALObjectType.codeunit;
        const ranges = [{ from: 50000, to: 50009 }];
        const consumption = [50000, 50001, 50002, 50004];
        const storage = AzureTestLibrary.Stub.app().authorize().add(type, consumption);
        AzureTestLibrary.Fake.useStorage(storage);
        const bindings = {
            ranges: storage.ranges(),
            ids: storage.objectIds(type)
        };
        const response = await azureFunction.invoke("GET", { appId: storage.appId, authKey: storage.authKey, type, ranges }, bindings);
        expect(response).toBeStatus(200);
        expect(response.body.id).toStrictEqual(50003);
        expect(response.body.available).toStrictEqual(true);
        expect(response.body.hasConsumption).toStrictEqual(true);
        expect(response.body.updated).toStrictEqual(false);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(expect.objectContaining(ranges));
        expect(storage.objectIds(type)).toEqual(expect.objectContaining(consumption));
    });

    it("Succeeds committing next ID without previous consumption", async () => {
        const type = ALObjectType.codeunit;
        const ranges = [{ from: 50000, to: 50009 }];
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const bindings = {};
        const response = await azureFunction.invoke("POST", { appId: storage.appId, authKey: storage.authKey, type, ranges }, bindings);
        expect(response).toBeStatus(200);
        expect(response.body.id).toStrictEqual(50000);
        expect(response.body.available).toStrictEqual(true);
        expect(response.body.hasConsumption).toStrictEqual(true);
        expect(response.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(expect.objectContaining(ranges));
        expect(storage).toHaveConsumption(type);
        expect(storage.objectIds(type)).toEqual(expect.objectContaining([50000]));
    });

    it("Succeeds committing next ID with previous consumption", async () => {
        const type = ALObjectType.codeunit;
        const ranges = [{ from: 50000, to: 50009 }];
        const consumption = [50000, 50001, 50002, 50004];
        const storage = AzureTestLibrary.Stub.app().authorize().add(type, consumption);
        AzureTestLibrary.Fake.useStorage(storage);
        const bindings = {
            ranges: storage.ranges(),
            ids: storage.objectIds(type)
        };
        const response = await azureFunction.invoke("POST", { appId: storage.appId, authKey: storage.authKey, type, ranges }, bindings);
        expect(response).toBeStatus(200);
        expect(response.body.id).toStrictEqual(50003);
        expect(response.body.available).toStrictEqual(true);
        expect(response.body.hasConsumption).toStrictEqual(true);
        expect(response.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(expect.objectContaining(ranges));
        expect(storage.objectIds(type)).toEqual(expect.objectContaining([50000, 50001, 50002, 50003, 50004]));
    });
});
