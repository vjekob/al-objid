import { AzureTestLibrary } from "./AzureTestLibrary";

jest.mock("azure-storage");

describe("Testing function api/v1/getConsumption", () => {
    const appId = AzureTestLibrary.Stub.appId();
    const azureFunction = new AzureTestLibrary.Fake.AzureFunction("../src/functions/v1/getConsumption");

    it("Fails on missing appId", async () => {
        AzureTestLibrary.Fake.useStorage({});
        const response = await azureFunction.invoke("GET");
        expect(response).toBeStatus(400);
    });

    it("Fails on missing authorization", async () => {
        AzureTestLibrary.Fake.useStorage(AzureTestLibrary.Stub.authenticatedApp(appId));
        const response = await azureFunction.invoke("GET", { appId });
        expect(response).toBeStatus(401);
    });

    it("Fails on invalid authorization", async () => {
        AzureTestLibrary.Fake.useStorage(AzureTestLibrary.Stub.authenticatedApp(appId));
        const response = await azureFunction.invoke("GET", { appId, authKey: "invalid" });
        expect(response).toBeStatus(401);
    });

    it("Fails on missing authorization", async () => {
        const key = AzureTestLibrary.Stub.authKey();
        const storage = AzureTestLibrary.Stub.authenticatedApp(appId, key);
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("GET", { appId, authKey: key });
        expect(response).toBeStatus(200);
    });

    it("Fails on missing authorization", async () => {
        let storage = {
            [`${appId}/_ranges.json`]: [{ from: 1, to: 9 }],
            [`${appId}/codeunit.json`]: [1, 2, 3],
            [`${appId}/page.json`]: [4, 5, 6],
        };
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await azureFunction.invoke("GET", { appId });
        expect(response).toBeStatus(200);
        expect(response.body).toBeDefined();
        expect(response.body.codeunit).toEqual(expect.arrayContaining([1, 2, 3]));
        expect(response.body.page).toEqual(expect.arrayContaining([4, 5, 6]));
        expect(response.body._ranges).toBeUndefined();
    });
});
