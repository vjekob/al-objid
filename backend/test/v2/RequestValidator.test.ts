import { AzureFunctionRequestHandler } from "../../src/functions/v2/RequestHandler";
import { AzureTestLibrary } from "../AzureTestLibrary";

jest.mock("azure-storage");

async function invokeHandler(rules: any = undefined, body: any = {}) {
    const handler = new AzureFunctionRequestHandler(async () => { });
    if (rules) {
        handler.validator.expect(rules);
    }
    AzureTestLibrary.Fake.useStorage({});
    const context = AzureTestLibrary.Fake.useContext("GET", { appId: "mock", ...body });
    await handler.azureFunction(context, context.req);
    return context.res;
}

describe("Testing v2 RequestValidator", () => {
    it("Succeeds on unspecified validation rules", async () => {
        const response = await invokeHandler();
        expect(response.status).toBe(200);
    });

    it("Succeeds on empty validation rules", async () => {
        const response = await invokeHandler({}, {});
        expect(response.status).toBe(200);
    });

    it("Fails on invalid number", async () => {
        const response = await invokeHandler({ "number": "number" }, { "number": "string" });
        expect(response.status).toBe(400);
    });

    it("Succeeds on valid number", async () => {
        const response = await invokeHandler({ "number": "number" }, { "number": 3.14 });
        expect(response.status).toBe(200);
    });

    it("Fails on number[] instead of number", async () => {
        const response = await invokeHandler({ "number": "number" }, { "number": [3.14] });
        expect(response.status).toBe(400);
    });

    it("Fails on invalid number[]", async () => {
        const response = await invokeHandler({ "number": "number[]" }, { "number": 3.14 });
        expect(response.status).toBe(400);
    });

    it("Succeeds on valid number[]", async () => {
        const response = await invokeHandler({ "number": "number[]" }, { "number": [3.14] });
        expect(response.status).toBe(200);
    });

    it("Fails on invalid ALObjectType", async () => {
        const response = await invokeHandler({ "ALObjectType": "ALObjectType" }, { "ALObjectType": "interface" });
        expect(response.status).toBe(400);
    });

    it("Succeeds on valid ALObjectType", async () => {
        const response = await invokeHandler({ "ALObjectType": "ALObjectType" }, { "ALObjectType": "codeunit" });
        expect(response.status).toBe(200);
    });

    it("Fails on invalid ALObjectType[]", async () => {
        const response = await invokeHandler({ "ALObjectType": "ALObjectType[]" }, { "ALObjectType": "codeunit" });
        expect(response.status).toBe(400);
    });

    it("Succeeds on valid ALObjectType[]", async () => {
        const response = await invokeHandler({ "ALObjectType": "ALObjectType[]" }, { "ALObjectType": ["codeunit"] });
        expect(response.status).toBe(200);
    });

    it("Fails on invalid NonZeroNumber", async () => {
        const response = await invokeHandler({ "NonZeroNumber": "NonZeroNumber" }, { "NonZeroNumber": 0 });
        expect(response.status).toBe(400);
    });

    it("Succeeds on valid NonZeroNumber", async () => {
        const response = await invokeHandler({ "NonZeroNumber": "NonZeroNumber" }, { "NonZeroNumber": 3.14 });
        expect(response.status).toBe(200);
    });

    it("Fails on invalid NonZeroNumber[]", async () => {
        const response = await invokeHandler({ "NonZeroNumber": "NonZeroNumber[]" }, { "NonZeroNumber": 3.14 });
        expect(response.status).toBe(400);
    });

    it("Succeeds on valid NonZeroNumber[]", async () => {
        const response = await invokeHandler({ "NonZeroNumber": "NonZeroNumber[]" }, { "NonZeroNumber": [3.14] });
        expect(response.status).toBe(200);
    });

    it("Fails on invalid Range - type", async () => {
        const response = await invokeHandler({ "Range": "Range" }, { "Range": 0 });
        expect(response.status).toBe(400);
    });

    it("Fails on invalid Range - content", async () => {
        const response = await invokeHandler({ "Range": "Range" }, { "Range": { form: 12, to: 22 } });
        expect(response.status).toBe(400);
    });

    it("Succeeds on valid Range", async () => {
        const response = await invokeHandler({ "Range": "Range" }, { "Range": { from: 12, to: 22 } });
        expect(response.status).toBe(200);
    });

    it("Succeeds on extended Range", async () => {
        const response = await invokeHandler({ "Range": "Range" }, { "Range": { from: 12, to: 22, extended: true, skip: 2 } });
        expect(response.status).toBe(200);
    });

    it("Fails on invalid Range[]", async () => {
        const response = await invokeHandler({ "Range": "Range[]" }, { "Range": { from: 12, to: 22 } });
        expect(response.status).toBe(400);
    });

    it("Succeeds on valid Range[]", async () => {
        const response = await invokeHandler({ "Range": "Range[]" }, { "Range": [{ from: 12, to: 22 }] });
        expect(response.status).toBe(200);
    });

    it("Fails on complex setup", async () => {
        const response = await invokeHandler(
            {
                "type1": "ALObjectType",
                "type2": "ALObjectType",
                "count": "NonZeroNumber",
                "ids": "number[]",
                "ranges": "Range[]"
            },
            {
                "type1": "code",
                "type2": "page",
                "count": "string",
                "ids": [1, 2, 3],
                "ranges": { From: 12, To: 13 }
            }
        );
        expect(response.status).toBe(400);
    });

    it("Succeeds on complex setup", async () => {
        const response = await invokeHandler(
            {
                "type1": "ALObjectType",
                "type2": "ALObjectType",
                "count": "NonZeroNumber",
                "ids": "number[]",
                "ranges": "Range[]"
            },
            {
                "type1": "tableextension",
                "type2": "pageextension",
                "count": 11,
                "ids": [0, 1, 2],
                "ranges": [{ from: 0, to: 2 }, { from: 1, to: 3 }]
            }
        );
        expect(response.status).toBe(200);
    });
});
