import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { disableGetNextRateLimit, run as getNext} from "../../src/functions/v2/getNext";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";
import { Range } from "../../src/functions/v2/TypesV2";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers();
disableGetNextRateLimit();

describe("Testing function api/v2/getNext", () => {
    const ranges: Range[] = [{ from: 50000, to: 50009 }];
    const rangesMulti: Range[] = [{ from: 50000, to: 50009 }, {from: 60000, to: 60009}];

    it("Fails on invalid request content", async () => {
        const context = new Mock.Context(new Mock.Request("POST", { appId: "_mock_" }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(400);
    });

    it("Succeeds getting next ID from a previously unknown app", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: "_mock_", ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50000);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(false);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(storage).not.toHaveConsumption(type);
        expect(context.bindings.notify).toBeUndefined();
    });

    it("Succeeds getting next ID without previous consumption from a known app", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50000);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(storage).not.toHaveConsumption(type);
        expect(context.bindings.notify).toBeUndefined();
    });

    it("Succeeds getting next ID with previous consumption", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app().setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50003);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(storage.objectIds(type)).toEqual(expect.objectContaining(consumption));
        expect(context.bindings.notify).toBeUndefined();

        expect(context.res.body._appInfo).toBeUndefined();
    });

    it("Succeeds getting next field ID from own table without previous consumption", async () => {
        const storage = new StubStorage().app();
        const type = storage.toALObjectType("table_50000");
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(1);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(storage).not.toHaveConsumption(type);
        expect(context.bindings.notify).toBeUndefined();
    });

    it("Succeeds getting next field ID from own table with previous consumption", async () => {
        const consumption = [1, 2, 4, 5, 6, 50000, 50001, 50002, 50004];
        const storage = new StubStorage().app();
        const type = storage.toALObjectType("table_50000");
        storage.setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(3);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(storage.objectIds(type)).toEqual(expect.objectContaining(consumption));
        expect(context.bindings.notify).toBeUndefined();

        expect(context.res.body._appInfo).toBeUndefined();
    });

    it("Succeeds getting next field ID from third-party table without previous consumption", async () => {
        const storage = new StubStorage().app();
        const type = storage.toALObjectType("table_18");
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50000);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(storage).not.toHaveConsumption(type);
        expect(context.bindings.notify).toBeUndefined();
    });

    it("Succeeds getting next field ID from third-party table with previous consumption", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const storage = new StubStorage().app();
        const type = storage.toALObjectType("table_18");
        storage.setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50003);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(storage.objectIds(type)).toEqual(expect.objectContaining(consumption));
        expect(context.bindings.notify).toBeUndefined();

        expect(context.res.body._appInfo).toBeUndefined();
    });

    it("Succeeds committing next ID against a previously unknown app", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: "_mock_", ranges, type, user: "fake" }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50000);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();

        storage.setAppInspectionContext("_mock_");
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(ranges);
        expect(storage).toHaveConsumption(type);
        expect(storage.objectIds(type)).toEqual([50000]);

        expect(storage.log().length).toBe(1);
        expect(storage.log()[0].eventType).toBe("getNext");
        expect(storage.log()[0].data).toEqual({ type: "codeunit", id: 50000 });
        expect(storage.log()[0].user).toBe("fake");

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe("_mock_");

        expect(context.res.body._appInfo).toBeDefined();
        expect(context.res.body._appInfo._authorization).toBeUndefined();
        expect(context.res.body._appInfo.codeunit).toEqual([50000]);
    });

    it("Succeeds committing next ID without previous consumption", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type, user: "fake" }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50000);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(ranges);
        expect(storage).toHaveConsumption(type);
        expect(storage.objectIds(type)).toEqual([50000]);

        expect(storage.log().length).toBe(1);
        expect(storage.log()[0].eventType).toBe("getNext");
        expect(storage.log()[0].data).toEqual({ type: "codeunit", id: 50000 });
        expect(storage.log()[0].user).toBe("fake");

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);

        expect(context.res.body._appInfo).toBeDefined();
        expect(context.res.body._appInfo._authorization).toBeUndefined();
        expect(context.res.body._appInfo.codeunit).toEqual([50000]);
    });

    it("Succeeds committing next ID without previous consumption, without logging user", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage.log().length).toBe(0);
    });

    it("Succeeds committing next ID with previous consumption and stale log", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app()
            .setConsumption(type, consumption)
            .setLog([{ timestamp: 1, eventType: "getNext", user: "mock", data: { type: "table", id: 50000 } }]);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type, user: "fake" }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50003);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(ranges);
        expect(storage.objectIds(type)).toEqual([50000, 50001, 50002, 50003, 50004]);

        expect(storage.log().length).toBe(1);
        expect(storage.log()[0].eventType).toBe("getNext");
        expect(storage.log()[0].data).toEqual({ type: "codeunit", id: 50003 });
        expect(storage.log()[0].user).toBe("fake");

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);

        expect(context.res.body._appInfo).toBeDefined();
        expect(context.res.body._appInfo._authorization).toBeUndefined();
        expect(context.res.body._appInfo.codeunit).toEqual([50000, 50001, 50002, 50003, 50004]);
    });

    it("Succeeds committing next ID with previous consumption and stale log, without logging user", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app()
            .setConsumption(type, consumption)
            .setLog([{ timestamp: 1, eventType: "getNext", user: "mock", data: { type: "table", id: 50000 } }]);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage.log().length).toBe(0);
    });

    it("Succeeds committing next ID with previous consumption and fresh log", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const log = [{ timestamp: Date.now(), eventType: "getNext", user: "mock", data: { type: "table", id: 50000 } }];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app()
            .setConsumption(type, consumption)
            .setLog(log);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type, user: "fake" }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50003);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(ranges);
        expect(storage.objectIds(type)).toEqual([50000, 50001, 50002, 50003, 50004]);

        expect(storage.log().length).toBe(2);
        expect(storage.log()[1].eventType).toBe("getNext");
        expect(storage.log()[1].data).toEqual({ type: "codeunit", id: 50003 });
        expect(storage.log()[1].user).toBe("fake");

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);

        expect(context.res.body._appInfo).toBeDefined();
        expect(context.res.body._appInfo._authorization).toBeUndefined();
        expect(context.res.body._appInfo.codeunit).toEqual([50000, 50001, 50002, 50003, 50004]);
    });


    it("Succeeds committing next ID with previous consumption and fresh log, without logging user", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const log = [{ timestamp: Date.now(), eventType: "getNext", user: "mock", data: { type: "table", id: 50000 } }];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app()
            .setConsumption(type, consumption)
            .setLog(log);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage.log().length).toBe(1);
    });

    it("Succeeds committing next field ID to third-party enum with previous consumption", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const storage = new StubStorage().app();
        const type = storage.toALObjectType("enum_18");
        storage.setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res.body.id).toStrictEqual(50003);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(ranges);
        expect(storage.objectIds(type)).toEqual([50000, 50001, 50002, 50003, 50004]);
    });

    it("Succeeds committing next field ID to own enumextension with previous consumption", async () => {
        const consumption = [1, 2, 4, 5, 6, 50000, 50001, 50002, 50004];
        const storage = new StubStorage().app();
        const type = storage.toALObjectType("enumextension_50000");
        storage.setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type }));
        await getNext(context, context.req);
        expect(context.res.body.id).toStrictEqual(3);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(1);
        expect(storage.ranges()).toEqual(ranges);
        expect(storage.objectIds(type)).toEqual([1, 2, 3, 4, 5, 6, 50000, 50001, 50002, 50004]);
    });

    it("Succeeds getting next ID from multiple ranges from a previously unknown app", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: "_mock_", ranges: rangesMulti, perRange: true, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual([50000, 60000]);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(false);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(storage).not.toHaveConsumption(type);
        expect(context.bindings.notify).toBeUndefined();
    });

    it("Succeeds getting next ID from multiple ranges with previous consumption", async () => {
        const consumption = [50000, 50001, 50002, 50004, 60000, 60002];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app().setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId, ranges: rangesMulti, perRange: true, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual([50003, 60001]);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(context.bindings.notify).toBeUndefined();
    });

    it("Succeeds getting next ID from multiple ranges with previous consumption, with one range fully consumed", async () => {
        const consumption = [50000, 50001, 50002, 50003, 50004, 50004, 50005, 50006, 50007, 50008, 50009, 60000];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app().setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId, ranges: rangesMulti, perRange: true, type }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual([60001]);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(false);
        expect(storage).not.toHaveChanged();
        expect(storage.ranges()).toHaveLength(0);
        expect(context.bindings.notify).toBeUndefined();
    });

    it("Succeeds committing next ID to a specific range without previous consumption", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges: rangesMulti, perRange: true, require: 50000, type, user: "fake" }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50000);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(2);
        expect(storage.ranges()).toEqual(rangesMulti);
        expect(storage).toHaveConsumption(type);
        expect(storage.objectIds(type)).toEqual([50000]);
    });

    it("Succeeds committing next ID to a different specific range without previous consumption", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges: rangesMulti, perRange: true, require: 60000, type, user: "fake" }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(60000);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(2);
        expect(storage.ranges()).toEqual(rangesMulti);
        expect(storage).toHaveConsumption(type);
        expect(storage.objectIds(type)).toEqual([60000]);
    });

    it("Succeeds committing next ID to a specific range with previous consumption", async () => {
        const consumption = [50000, 50001, 50002, 50004, 60000, 60002];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app().setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges: rangesMulti, perRange: true, require: 50000, type, user: "fake" }));
        await getNext(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(context.res.body.id).toStrictEqual(50003);
        expect(context.res.body.available).toStrictEqual(true);
        expect(context.res.body.hasConsumption).toStrictEqual(true);
        expect(context.res.body.updated).toStrictEqual(true);
        expect(storage).toHaveChanged();
        expect(storage.ranges()).toHaveLength(2);
        expect(storage.ranges()).toEqual(rangesMulti);
        expect(storage).toHaveConsumption(type);
        expect(storage.objectIds(type)).toEqual([50000, 50001, 50002, 50003, 50004, 60000, 60002]);
    });

    it("Fails committing next ID to a specific range with explicit range fully consumed", async () => {
        const consumption = [50000, 50001, 50002, 50003, 50004, 50004, 50005, 50006, 50007, 50008, 50009, 60000];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app().setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges: rangesMulti, perRange: true, require: 50009, type, user: "fake" }));
        await getNext(context, context.req);
        // expect(context.res).toBeStatus(200);
        // expect(context.res.body.id).toStrictEqual(0);
        // expect(context.res.body.available).toStrictEqual(false);
        // expect(context.res.body.hasConsumption).toStrictEqual(true);
        // expect(context.res.body.updated).toStrictEqual(false);
        // expect(storage).not.toHaveChanged();
    });
});
