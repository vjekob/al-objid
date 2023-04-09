import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { disableStoreAssignmentRateLimit, run as storeAssignment } from "../../src/functions/v2/storeAssignment";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();
disableStoreAssignmentRateLimit();

describe("Testing function api/v2/storeAssignment", () => {

    it("Succeeds adding assignment for a missing ID", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const type = ALObjectType.codeunit;
        const id = 50006;
        const storage = new StubStorage().app()
            .setConsumption(type, consumption)
            .setLog([{ timestamp: 1, eventType: "getNext", user: "mock", data: { type: "table", id: 50000 } }]);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, type, id, user: "fake" }));
        await storeAssignment(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.objectIds(type)).toEqual([50000, 50001, 50002, 50004, 50006]);

        expect(storage.log().length).toBe(1);
        expect(storage.log()[0].eventType).toBe("addAssignment");
        expect(storage.log()[0].data).toEqual({ type: "codeunit", id });
        expect(storage.log()[0].user).toBe("fake");

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);

        expect(context.res.body._appInfo).toBeDefined();
        expect(context.res.body._appInfo._authorization).toBeUndefined();
        expect(context.res.body._appInfo.codeunit).toEqual([50000, 50001, 50002, 50004, 50006]);
    });

    it("Succeeds removing assignment for an existing ID", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const type = ALObjectType.codeunit;
        const id = 50002;
        const storage = new StubStorage().app()
            .setConsumption(type, consumption)
            .setLog([{ timestamp: 1, eventType: "getNext", user: "mock", data: { type: "table", id: 50000 } }]);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("DELETE", { appId: storage.appId, type, id, user: "fake" }));
        await storeAssignment(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.objectIds(type)).toEqual([50000, 50001, 50004]);

        expect(storage.log().length).toBe(1);
        expect(storage.log()[0].eventType).toBe("removeAssignment");
        expect(storage.log()[0].data).toEqual({ type: "codeunit", id });
        expect(storage.log()[0].user).toBe("fake");

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);

        expect(context.res.body._appInfo).toBeDefined();
        expect(context.res.body._appInfo._authorization).toBeUndefined();
        expect(context.res.body._appInfo.codeunit).toEqual([50000, 50001, 50004]);
    });

    it("Succeeds adding assignment on no previous consumption", async () => {
        const type = ALObjectType.codeunit;
        const id = 50006;
        const storage = new StubStorage().app()
            .setLog([{ timestamp: 1, eventType: "getNext", user: "mock", data: { type: "table", id: 50000 } }]);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, type, id, user: "fake" }));
        await storeAssignment(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.objectIds(type)).toEqual([50006]);

        expect(storage.log().length).toBe(1);
        expect(storage.log()[0].eventType).toBe("addAssignment");
        expect(storage.log()[0].data).toEqual({ type: "codeunit", id });
        expect(storage.log()[0].user).toBe("fake");

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);

        expect(context.res.body._appInfo).toBeDefined();
        expect(context.res.body._appInfo._authorization).toBeUndefined();
        expect(context.res.body._appInfo.codeunit).toEqual([50006]);
    });

    it("Succeeds removing assignment for a non-existing ID", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const type = ALObjectType.codeunit;
        const id = 50003;
        const storage = new StubStorage().app()
            .setConsumption(type, consumption)
            .setLog([{ timestamp: 1, eventType: "getNext", user: "mock", data: { type: "table", id: 50000 } }]);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("DELETE", { appId: storage.appId, type, id, user: "fake" }));
        await storeAssignment(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.objectIds(type)).toEqual([50000, 50001, 50002, 50004]);

        expect(storage.log().length).toBe(1);
        expect(storage.log()[0].eventType).toBe("getNext");
        expect(storage.log()[0].data).toEqual({ type: "table", id: 50000 });
        expect(storage.log()[0].user).toBe("mock");

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);

        expect(context.res.body._appInfo).toBeDefined();
        expect(context.res.body._appInfo._authorization).toBeUndefined();
        expect(context.res.body._appInfo.codeunit).toEqual([50000, 50001, 50002, 50004]);
    });

    it("Succeeds adding assignment for an existing ID", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const type = ALObjectType.codeunit;
        const id = 50001;
        const storage = new StubStorage().app().setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, type, id, user: "fake" }));
        await storeAssignment(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.objectIds(type)).toEqual([50000, 50001, 50002, 50004]);

        expect(context.bindings.notify).not.toBeDefined();
        expect(context.res.body._appInfo).not.toBeDefined();
    });

});
