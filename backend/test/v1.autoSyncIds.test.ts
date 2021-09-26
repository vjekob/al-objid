import { ALObjectType } from "../src/functions/v2/ALObjectType";
import { AzureTestLibrary } from "./AzureTestLibrary";

jest.mock("azure-storage");

describe("Testing function api/v1/autoSyncIds", () => {
    const azureFunction = new AzureTestLibrary.Fake.AzureFunction("../src/functions/v1/autoSyncIds");

    it("Fails on missing appFolders", async() => {
        await expect(azureFunction).toFail("POST", 400);
    });

    it("Fails on invalid appFolders property type", async() => {
        const response = await azureFunction.invoke("POST", { appFolders: 0 });
        expect(response).toBeStatus(400);
    });

    it("Fails on invalid appFolders missing ids", async() => {
        const response = await azureFunction.invoke("POST", { appFolders: [ {}, {} ] });
        expect(response).toBeStatus(400);
    });

    it("Fails on invalid appFolders ids not object", async() => {
        const response = await azureFunction.invoke("POST", { appFolders: [ { appId: "0", ids: 1 }, { appId: "1", ids: 1 } ] });
        expect(response).toBeStatus(400);
    });

    it("Fails on invalid appFolders ids invalid object type", async() => {
        const response = await azureFunction.invoke("POST", { appFolders: [ { appId: "0", ids: { interface: [1, 2, 3] } }, { appId: "1", ids: { interface: [1, 2, 3] } } ] });
        expect(response).toBeStatus(400);
    });

    it("Fails on invalid appFolders ids not numbers", async() => {
        const response = await azureFunction.invoke("POST", { appFolders: [ { appId: "0", ids: { codeunit: ["1", "2", "3"] } }, { appId: "1", ids: { codeunit: ["1", "2", "3"] } } ] });
        expect(response).toBeStatus(400);
    });

    it("Does not update blob on unauthorized request", async() => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appFolders: [ { appId: storage.appId, ids: { codeunit: [1, 2, 3] } } ] });
        expect(response).toBeStatus(200);
        expect(storage).not.toHaveChanged();
        expect(storage).not.toHaveConsumption(ALObjectType.codeunit);
    });

    it("Overwrites blob on authorized request", async() => {
        const storage = AzureTestLibrary.Stub.app().authorize().add(ALObjectType.codeunit, [4, 5, 6]);
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appFolders: [ { appId: storage.appId, authKey: storage.authKey, ids: { codeunit: [1, 2, 3] } } ] });
        expect(storage).toContainIds(ALObjectType.codeunit, [1, 2, 3]);
        expect(storage).toContainIds(ALObjectType.page, []);
        expect(response).toBeStatus(200);
    });

    it("Merges blob on patch request", async() => {
        const storage = AzureTestLibrary.Stub.app().authorize().add(ALObjectType.codeunit, [4, 5, 6]);
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("PATCH", { appFolders: [ { appId: storage.appId, authKey: storage.authKey, ids: { codeunit: [1, 2, 3] } } ] });
        expect(storage).toContainIds(ALObjectType.codeunit, [1, 2, 3, 4, 5, 6]);
        expect(response).toBeStatus(200);
    });
});
