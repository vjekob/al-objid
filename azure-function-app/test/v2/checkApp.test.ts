import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import checkApp from "../../src/functions/v2/checkApp";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();

describe("Testing function api/v2/checkApp", () => {

    it("Fails on missing app ID", async () => {
        const context = new Mock.Context(new Mock.Request("GET", { }));
        await checkApp(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Succeeds checking an existing app", async () => {
        const storage = new StubStorage().app();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId }));
        await checkApp(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body).toStrictEqual("true");
    });

    it("Succeeds checking a missing app", async () => {
        const storage = new StubStorage().app();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: "_non_existing_" }));
        await checkApp(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body).toStrictEqual("false");
    });
});
