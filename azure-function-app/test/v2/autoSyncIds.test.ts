import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import autoSyncIds from "../../src/functions/v2/autoSyncIds";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";


jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers()

describe("Testing function api/v2/autoSyncIds", () => {
    const appFolders: any = [
        { appId: "first", ids: { codeunit: [1, 3, 5], page: [2, 4, 6], report: [3] } },
        { appId: "second", ids: { table: [1, 3, 5], xmlport: [2, 4, 6], enum: [3] } },
    ];

    it("Fails on missing consumption specification", async () => {
        const context = new Mock.Context(new Mock.Request("POST"));
        await autoSyncIds(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Inserts new consumptions on POST against unknown apps", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { appFolders }));
        await autoSyncIds(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).not.toBeAuthorized();

        const app1 = storage.content[`first.json`];
        expect(app1).toBeDefined();
        expect(app1.codeunit).toEqual([1, 3, 5]);
        expect(app1.table).toBeUndefined();
        expect(app1.page).toEqual([2, 4, 6]);
        expect(app1.report).toEqual([3]);

        const app2 = storage.content[`second.json`];
        expect(app2).toBeDefined();
        expect(app2.table).toEqual([1, 3, 5]);
        expect(app2.codeunit).toBeUndefined();
        expect(app2.xmlport).toEqual([2, 4, 6]);
        expect(app2.enum).toEqual([3]);
    });

    it("Inserts new consumptions on PATCH against unknown apps", async () => {
        const storage = new StubStorage();
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("PATCH", { appFolders }));
        await autoSyncIds(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).not.toBeAuthorized();

        const app1 = storage.content[`first.json`];
        expect(app1).toBeDefined();
        expect(app1.codeunit).toEqual([1, 3, 5]);
        expect(app1.table).toBeUndefined();
        expect(app1.page).toEqual([2, 4, 6]);
        expect(app1.report).toEqual([3]);

        const app2 = storage.content[`second.json`];
        expect(app2).toBeDefined();
        expect(app2.table).toEqual([1, 3, 5]);
        expect(app2.codeunit).toBeUndefined();
        expect(app2.xmlport).toEqual([2, 4, 6]);
        expect(app2.enum).toEqual([3]);
    });

    it("Overwrites existing consumptions on POST against known apps", async () => {
        const storage = new StubStorage().app("first")
            .setConsumption(ALObjectType.codeunit, [2, 3, 4])
            .setConsumption(ALObjectType.table, [1, 2])
            .setConsumption(ALObjectType.page, [3, 4, 5]);
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { appFolders }));
        await autoSyncIds(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).not.toBeAuthorized();

        const app1 = storage.content[`first.json`];
        expect(app1).toBeDefined();
        expect(app1.codeunit).toEqual([1, 3, 5]);
        expect(app1.table).toBeUndefined();
        expect(app1.page).toEqual([2, 4, 6]);
        expect(app1.report).toEqual([3]);

        const app2 = storage.content[`second.json`];
        expect(app2).toBeDefined();
        expect(app2.table).toEqual([1, 3, 5]);
        expect(app2.codeunit).toBeUndefined();
        expect(app2.xmlport).toEqual([2, 4, 6]);
        expect(app2.enum).toEqual([3]);
    });

    it("Merges new consumptions on PATCH against known apps", async () => {
        const storage = new StubStorage().app("first")
            .setConsumption(ALObjectType.codeunit, [2, 3, 4])
            .setConsumption(ALObjectType.table, [1, 2])
            .setConsumption(ALObjectType.page, [3, 4, 5]);
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("PATCH", { appFolders }));
        await autoSyncIds(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();
        expect(storage).not.toBeAuthorized();

        const app1 = storage.content[`first.json`];
        expect(app1).toBeDefined();
        expect(app1.codeunit).toEqual([1, 2, 3, 4, 5]);
        expect(app1.table).toEqual([1, 2]);
        expect(app1.page).toEqual([2, 3, 4, 5, 6]);
        expect(app1.report).toEqual([3]);

        const app2 = storage.content[`second.json`];
        expect(app2).toBeDefined();
        expect(app2.table).toEqual([1, 3, 5]);
        expect(app2.codeunit).toBeUndefined();
        expect(app2.xmlport).toEqual([2, 4, 6]);
        expect(app2.enum).toEqual([3]);
    });

    it("Fails to perform update with unauthorized POST against an authorized app", async () => {
        const storage = new StubStorage().app("first")
            .setConsumption(ALObjectType.codeunit, [2, 3, 4])
            .setConsumption(ALObjectType.table, [1, 2])
            .setConsumption(ALObjectType.page, [3, 4, 5])
            .authorize();
        Mock.useStorage(storage.content);

        const context = new Mock.Context(new Mock.Request("POST", { appFolders }));
        await autoSyncIds(context, context.req);
        expect(context.res).toBeStatus(401);
    });

    it("Successfully performs update with authorized POST against an authorized app", async () => {
        const storage = new StubStorage().app("first")
            .setConsumption(ALObjectType.codeunit, [2, 3, 4])
            .setConsumption(ALObjectType.table, [1, 2])
            .setConsumption(ALObjectType.page, [3, 4, 5])
            .authorize();
        Mock.useStorage(storage.content);

        let folders = [...appFolders];
        folders[0] = {...folders[0], authKey: storage.authKey};
        const context = new Mock.Context(new Mock.Request("POST", { appFolders: folders }));
        await autoSyncIds(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).toHaveChanged();

        const app1 = storage.content[`first.json`];
        expect(app1).toBeDefined();
        expect(app1.codeunit).toEqual([1, 3, 5]);
        expect(app1.table).toBeUndefined();
        expect(app1.page).toEqual([2, 4, 6]);
        expect(app1.report).toEqual([3]);

        const app2 = storage.content[`second.json`];
        expect(app2).toBeDefined();
        expect(app2.table).toEqual([1, 3, 5]);
        expect(app2.codeunit).toBeUndefined();
        expect(app2.xmlport).toEqual([2, 4, 6]);
        expect(app2.enum).toEqual([3]);
    });
});
