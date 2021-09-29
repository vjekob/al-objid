import { ALObjectType } from "../../src/functions/v2/ALObjectType";
import { AzureTestLibrary } from "../AzureTestLibrary";

jest.mock("azure-storage");

describe("Testing function api/v1/syncIds", () => {
    const azureFunction = new AzureTestLibrary.Fake.AzureFunction("../src/functions/v1/syncIds");

    it("Fails on missing appId", async () => {
        AzureTestLibrary.Fake.useStorage({});
        const response = await azureFunction.invoke("POST");
        expect(response).toBeStatus(400);
        expect(response.body).toBe(`Missing property: appId`);
    });

    it("Fails on missing authorization", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appId: storage.appId });
        expect(response).toBeStatus(401);
    });

    it("Fails on missing consumption", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appId: storage.appId, authKey: storage.authKey });
        expect(response).toBeStatus(400);
        expect(response.body).toBe(`Missing property: ids`);
    });

    it("Fails on invalid consumption specification", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appId: storage.appId, authKey: storage.authKey, ids: 2 });
        expect(response).toBeStatus(400);
        expect(response.body.startsWith("Invalid type for property [ids]")).toBe(true);
    });

    it("Fails on invalid consumption specification: invalid object type", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appId: storage.appId, authKey: storage.authKey, ids: { fake: [1, 2, 3] } });
        expect(response).toBeStatus(400);
        expect(response.body).toBe("Invalid object ids specification: invalid object type specified");
    });

    it("Succeeds writing consumption without previous consumption", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        const consumption = { [ALObjectType.codeunit]: [1, 2, 3], [ALObjectType.table]: [4, 5, 6] };
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appId: storage.appId, authKey: storage.authKey, ids: consumption });
        expect(response).toBeStatus(200);
        expect(storage).toHaveConsumption(ALObjectType.codeunit);
        expect(storage).toHaveConsumption(ALObjectType.table);
        expect(storage).not.toHaveConsumption(ALObjectType.page);
        expect(storage.objectIds(ALObjectType.codeunit)).toEqual(expect.objectContaining(consumption[ALObjectType.codeunit]));
        expect(storage.objectIds(ALObjectType.table)).toEqual(expect.objectContaining(consumption[ALObjectType.table]));
    });

    it("Succeeds overwriting existing consumption", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize()
            .add(ALObjectType.codeunit, [7, 8, 9])
            .add(ALObjectType.table, [10, 11, 12])
            .add(ALObjectType.page, [13, 14, 15]);
        const consumption = { [ALObjectType.codeunit]: [1, 2, 3], [ALObjectType.table]: [4, 5, 6] };
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appId: storage.appId, authKey: storage.authKey, ids: consumption });
        expect(response).toBeStatus(200);
        expect(storage).toHaveConsumption(ALObjectType.codeunit);
        expect(storage).toHaveConsumption(ALObjectType.table);
        expect(storage).not.toHaveConsumption(ALObjectType.page);
        expect(storage.objectIds(ALObjectType.codeunit)).toEqual(expect.objectContaining(consumption[ALObjectType.codeunit]));
        expect(storage.objectIds(ALObjectType.table)).toEqual(expect.objectContaining(consumption[ALObjectType.table]));
    });

    it("Succeeds updating consumption without previous consumption", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        const consumption = { [ALObjectType.codeunit]: [1, 2, 3], [ALObjectType.table]: [4, 5, 6] };
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("PATCH", { appId: storage.appId, authKey: storage.authKey, ids: consumption });
        expect(response).toBeStatus(200);
        expect(storage).toHaveConsumption(ALObjectType.codeunit);
        expect(storage).toHaveConsumption(ALObjectType.table);
        expect(storage).not.toHaveConsumption(ALObjectType.page);
        expect(storage.objectIds(ALObjectType.codeunit)).toEqual(expect.objectContaining(consumption[ALObjectType.codeunit]));
        expect(storage.objectIds(ALObjectType.table)).toEqual(expect.objectContaining(consumption[ALObjectType.table]));
    });

    it("Succeeds updating consumption (merging with previous consumption)", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize()
            .add(ALObjectType.codeunit, [7, 8, 9])
            .add(ALObjectType.table, [10, 11, 12])
            .add(ALObjectType.page, [13, 14, 15]);
        const consumption = { [ALObjectType.codeunit]: [1, 2, 3], [ALObjectType.table]: [4, 5, 6] };
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("PATCH", { appId: storage.appId, authKey: storage.authKey, ids: consumption });
        expect(response).toBeStatus(200);
        expect(storage).toHaveConsumption(ALObjectType.codeunit);
        expect(storage).toHaveConsumption(ALObjectType.table);
        expect(storage).toHaveConsumption(ALObjectType.page);
        expect(storage.objectIds(ALObjectType.codeunit)).toEqual(expect.objectContaining([1, 2, 3, 7, 8, 9]));
        expect(storage.objectIds(ALObjectType.table)).toEqual(expect.objectContaining([4, 5, 6, 10, 11, 12]));
        expect(storage.objectIds(ALObjectType.page)).toEqual(expect.objectContaining([13, 14, 15]));
    });
});
