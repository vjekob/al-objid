import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import getNext from "../../src/functions/v2/getNext";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";
import { Range } from "../../src/functions/v2/TypesV2";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers()

describe("Testing function api/v2/getNext", () => {
    const ranges: Range[] = [{ from: 50000, to: 50009}];

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
    });

    it("Succeeds committing next ID against a previously unknown app", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: "_mock_", ranges, type }));
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

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe("_mock_");
    });

    it("Succeeds committing next ID without previous consumption", async () => {
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app();
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type }));
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

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);
    });

    it("Succeeds committing next ID with previous consumption", async () => {
        const consumption = [50000, 50001, 50002, 50004];
        const type = ALObjectType.codeunit;
        const storage = new StubStorage().app().setConsumption(type, consumption);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("POST", { appId: storage.appId, ranges, type }));
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

        expect(context.bindings.notify).toBeDefined();
        expect(context.bindings.notify.appId).toBe(storage.appId);
    });
});
