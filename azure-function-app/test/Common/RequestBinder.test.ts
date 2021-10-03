import { ErrorResponse } from "../../src/common/ErrorResponse";
import { AzureFunctionRequestHandler } from "../../src/functions/v2/RequestHandler";
import { AzureTestLibrary } from "../AzureTestLibrary";

jest.mock("azure-storage");

describe("Testing v2 RequestBinder", () => {
    const s1 = "__test__1__", s2 = "__test__2__", s3 = "__test__3__";
    const handler = new AzureFunctionRequestHandler(async (_, bindings) => {
        if (bindings && bindings.appId === s1 && bindings.test === s2 && bindings.consumption === s3) return { success: true };
        return new ErrorResponse("Bindings not valid", 418);
    });

    handler.bind("{appId}.json").to("appId");
    handler.bind("{test}").to("test");
    handler.bind("{appId}/{id}/consumption/{type}_data.json").to("consumption");

    it("Fails on all incorrect bindings", async () => {
        AzureTestLibrary.Fake.useStorage({});

        const context = AzureTestLibrary.Fake.useContext("GET", {
            appId: "__mock__",
            test: "__fake__",
            type: "codeunit",
            id: "1000"
        });      

        await handler.azureFunction(context as any, context.req as any);
        expect(context.res.status).toEqual(418);
    });

    it("Fails on single incorrect binding", async () => {
        const storage = {
            "__mock__.json": s1,
            "__fake__": s2,
            "__mock__/1000/consumption/codeunit_data.json": s3,
        };
        AzureTestLibrary.Fake.useStorage(storage);

        const context = AzureTestLibrary.Fake.useContext("GET", {
            appId: "__mock__",
            test: "__fake__",
            type: "codeunit",
            id: "1001"
        });      
        await handler.azureFunction(context as any, context.req as any);
        expect(context.res.status).toEqual(418);
    });

    it("Makes sure bound data is available to request handler", async () => {
        const storage = {
            "__mock__.json": s1,
            "__fake__": s2,
            "__mock__/1000/consumption/codeunit_data.json": s3,
        };
        AzureTestLibrary.Fake.useStorage(storage);

        const context = AzureTestLibrary.Fake.useContext("GET", {
            appId: "__mock__",
            test: "__fake__",
            type: "codeunit",
            id: "1000"
        });
        await handler.azureFunction(context as any, context.req as any);
        expect(context.res.status).toEqual(200);
        expect(context.res.body).toBeDefined();
        expect(context.res.body.success).toStrictEqual(true);
    });
});
