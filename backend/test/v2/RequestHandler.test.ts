import { AzureFunctionRequestHandler } from "../../src/functions/v2/RequestHandler";
import { AzureTestLibrary } from "../AzureTestLibrary";

jest.mock("azure-storage");

async function invokeHandler(body: any) {
    const handler = new AzureFunctionRequestHandler(async () => { });
    const context = AzureTestLibrary.Fake.useContext("GET", Array.isArray(body) ? [...body] : { ...body });
    await handler.azureFunction(context, context.req);
    return context.res;
}

describe("Testing v2 RequestHandler", () => {
    it("Fails on missing appId", async () => {
        const response = await invokeHandler({});
        expect(response.status).toBe(400);
    });

    it("Succeeds when appId is present", async () => {
        AzureTestLibrary.Fake.useStorage({});
        const response = await invokeHandler({ appId: "1" });
        expect(response.status).toBe(200);
    });

    it("Fails on missing appId in multi-request body", async () => {
        const response = await invokeHandler([{}, {}, {}]);
        expect(response.status).toBe(400);
    });

    it("Succeeds when appId is present in a multi-request body", async () => {
        AzureTestLibrary.Fake.useStorage({});
        const response = await invokeHandler([{ appId: "1" }, { appId: "2" }, { appId: "3" }]);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
    });

    it("Fails on invalid authorization", async () => {
        const app1 = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(app1);
        const response = await invokeHandler({ appId: app1.appId, authKey: "__invalid__" });
        expect(response.status).toBe(401);
    });

    it("Succeeds on valid authorization", async () => {
        const app1 = AzureTestLibrary.Stub.app().authorize();
        AzureTestLibrary.Fake.useStorage(app1);
        const response = await invokeHandler({ appId: app1.appId, authKey: app1.authKey });
        expect(response.status).toBe(200);
    });

    it("Fails on invalid authorization in a multi-request body", async () => {
        const storage = AzureTestLibrary.Stub.storage();
        const app1 = storage.app().authorize();
        const app2 = storage.app().authorize();
        const app3 = storage.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await invokeHandler([{ appId: app1.appId, authKey: "__invalid__" }, { appId: app2.appId, authKey: "__invalid__" }, { appId: app3.appId, authKey: "__invalid__" }]);
        expect(response.status).toBe(401);
    });

    it("Succeeds on valid authorization in a multi-request body", async () => {
        const storage = AzureTestLibrary.Stub.storage();
        const app1 = storage.app().authorize();
        const app2 = storage.app().authorize();
        const app3 = storage.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await invokeHandler([{ appId: app1.appId, authKey: app1.authKey }, { appId: app2.appId, authKey: app2.authKey }, { appId: app3.appId, authKey: app3.authKey }]);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
    });

    it("Fails on single invalid authorization in a multi-request body", async () => {
        const storage = AzureTestLibrary.Stub.storage();
        const app1 = storage.app().authorize();
        const app2 = storage.app().authorize();
        const app3 = storage.app().authorize();
        AzureTestLibrary.Fake.useStorage(storage);
        const response = await invokeHandler([{ appId: app1.appId, authKey: app1.authKey }, { appId: app2.appId, authKey: app2.authKey }, { appId: app3.appId, authKey: "__invalid__" }]);
        expect(response.status).toBe(401);
    });
});
