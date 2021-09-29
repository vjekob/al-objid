import { AzureFunctionRequestHandler } from "../../src/functions/v2/RequestHandler";
import { AzureTestLibrary } from "../AzureTestLibrary";

jest.mock("azure-storage");

async function invokeHandler() {
    const handler = new AzureFunctionRequestHandler(async () => { });
    const context = {
        req: {
            headers: {},
            method: "GET",
            body: { appId: "test" },
        } as any,
        res: {
            status: 200,
            body: undefined
        } as any,
        log: jest.fn()
    } as any;
    AzureTestLibrary.Fake.useStorage({});
    await handler.azureFunction(context, context.req);
    return context.res;
}

describe("Testing v2 RateLimiter", () => {
    // This test is not exactly fragile, but it depends on configuration in RateLimiter.ts. If that
    // configuration is changed, this test needs updating.
    // Currently, it's testing the violation of the 10-calls-per-1000-ms rule.
    it("Fails on too many requests", async () => {
        // First 10 succeed
        for (let i = 0; i < 10; i++) {
            let result = await invokeHandler();
            expect(result.status).toBe(200);
        }
        // 11th call fails for rate violation
        let result = await invokeHandler();
        expect(result.status).toBe(429);
    });
});
