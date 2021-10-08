import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import authorizeApp from "../../src/functions/v2/authorizeApp";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";


jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers()

describe("Testing function api/v2/authorizeApp", () => {

    it("Fails on missing appId", async () => {
        const context = new Mock.Context(new Mock.Request("POST"));
        await authorizeApp(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Fails on already authorized", async () => {
        const storage = new StubStorage().authorize();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId }));
        await authorizeApp(context, context.req);
        expect(context.res).toBeStatus(405);
        expect(storage).not.toHaveChanged();
    });

    it("Authorizes a previously unauthorized app", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId }));
        await authorizeApp(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).toBeAuthorized();
    });

    it("Fails to de-authorize a previously unauthorized app", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("DELETE", { appId: storage.appId }));
        await authorizeApp(context, context.req);
        expect(context.res).toBeStatus(405);
        expect(storage).not.toHaveChanged();
    });

    it("Fails to de-authorize an app with an invalid authorization key", async () => {
        const storage = new StubStorage().authorize();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("DELETE", { appId: storage.appId, authKey: "__mock_2__" }));
        await authorizeApp(context, context.req);
        expect(context.res).toBeStatus(401);
        expect(storage).not.toHaveChanged();
        expect(storage).toBeAuthorized();
    });

    it("De-authorizes a previously authorized app", async () => {
        const storage = new StubStorage().authorize();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("DELETE", { appId: storage.appId, authKey: storage.authKey }));
        await authorizeApp(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).not.toBeAuthorized();
    });
});
