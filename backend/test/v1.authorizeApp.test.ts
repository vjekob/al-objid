import { AzureTestLibrary } from "./AzureTestLibrary";

jest.mock("azure-storage");

describe("Testing function api/v1/authorizeApp", () => {
    const azureFunction = new AzureTestLibrary.Fake.AzureFunction("../src/functions/v1/authorizeApp");

    const appId = "__mock__";
    const authBlobId = `${appId}/_authorization.json`;

    it("Fails on missing appId", async () => {
        await expect(azureFunction).toFail("POST", 400);
    });

    it("Fails on already authorized", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appId: storage.appId });
        expect(response).toBeStatus(405);
        expect(storage).not.toHaveChanged();
    });

    it("Authorizes a previously unauthorized app", async () => {
        const storage = AzureTestLibrary.Stub.app();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("POST", { appId: storage.appId });
        expect(response).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).toBeAuthorized();
    });

    it("Fails to de-authorize a previously unauthorized app", async () => {
        const storage = AzureTestLibrary.Stub.app();
        AzureTestLibrary.Fake.useStorage({});
        const response = await azureFunction.invoke("DELETE", { appId: storage.appId });
        expect(response).toBeStatus(405);
        expect(storage).not.toHaveChanged();
    });

    it("Fails to de-authorize an app with an invalid authorization key", async () => {
        const storage = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("DELETE", { appId: storage.appId, authKey: "__mock_2__" });
        expect(response).toBeStatus(401);
        expect(storage).not.toHaveChanged();
    });

    it("De-authorizes a previously authorized app", async () => {
        const storage = AzureTestLibrary.Stub.storage();
        const app1 = storage.app().authorize();
        const app2 = storage.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("DELETE", { appId: app1.appId, authKey: app1.authKey });
        expect(response).toBeStatus(200);
        expect(app1).not.toBeAuthorized();
        expect(app2).toBeAuthorized();
    });

    it("Fails to delete authorization blob during de-authorization call", async () => {
        const storage = AzureTestLibrary.Stub.storage();
        const app1 = storage.app().authorize();
        const app2 = storage.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage, { preventDelete: true });
        const response = await azureFunction.invoke("DELETE", { appId: app1.appId, authKey: app1.authKey });
        expect(response).toBeStatus(400);
        expect(app1).toBeAuthorized();
        expect(app1).not.toHaveChanged();
    });
});
