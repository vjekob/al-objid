import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import syncIds from "../../src/functions/v2/syncIds";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers()

describe("Testing function api/v2/syncIds", () => {
    const ids = { codeunit: [1, 3, 5], page: [2, 4, 6], report: [3] };

    it("Fails on missing consumption specification", async () => {
        const context = new Mock.Context(new Mock.Request("POST", { appId: "_mock_" }));
        await syncIds(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Inserts new consumptions on POST against unknown app", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { appId: "_mock_", ids }));
        await syncIds(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();

        storage.setAppInspectionContext("_mock_");
        expect(storage).not.toBeAuthorized();
        expect(storage.objectIds(ALObjectType.codeunit)).toEqual([1, 3, 5]);
        expect(storage.objectIds(ALObjectType.table)).toBeUndefined();
        expect(storage.objectIds(ALObjectType.page)).toEqual([2, 4, 6]);
        expect(storage.objectIds(ALObjectType.report)).toEqual([3]);

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe("_mock_");
    });

    it("Inserts new consumptions on PATCH against unknown app", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("PATCH", { appId: "_mock_", ids }));
        await syncIds(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();

        storage.setAppInspectionContext("_mock_");
        expect(storage).not.toBeAuthorized();
        expect(storage.objectIds(ALObjectType.codeunit)).toEqual([1, 3, 5]);
        expect(storage.objectIds(ALObjectType.table)).toBeUndefined();
        expect(storage.objectIds(ALObjectType.page)).toEqual([2, 4, 6]);
        expect(storage.objectIds(ALObjectType.report)).toEqual([3]);

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe("_mock_");
    });

    it("Overwrites existing consumptions on POST against a known app", async () => {
        const storage = new StubStorage().app()
            .setConsumption(ALObjectType.codeunit, [2, 3, 4])
            .setConsumption(ALObjectType.table, [1, 2])
            .setConsumption(ALObjectType.page, [3, 4, 5]);
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ids }));
        await syncIds(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).not.toBeAuthorized();

        const app = storage.content[`${storage.appId}.json`];
        expect(app).toBeDefined();
        expect(app.codeunit).toEqual([1, 3, 5]);
        expect(app.table).toBeUndefined();
        expect(app.page).toEqual([2, 4, 6]);
        expect(app.report).toEqual([3]);

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);
    });

    it("Merges new consumptions on PATCH against a known app", async () => {
        const storage = new StubStorage().app()
            .setConsumption(ALObjectType.codeunit, [2, 3, 4])
            .setConsumption(ALObjectType.table, [1, 2])
            .setConsumption(ALObjectType.page, [3, 4, 5]);
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("PATCH", { appId: storage.appId, ids }));
        await syncIds(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).not.toBeAuthorized();

        const app = storage.content[`${storage.appId}.json`];
        expect(app).toBeDefined();
        expect(app.codeunit).toEqual([1, 2, 3, 4, 5]);
        expect(app.table).toEqual([1, 2]);
        expect(app.page).toEqual([2, 3, 4, 5, 6]);
        expect(app.report).toEqual([3]);

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);
    });
});
