import { Blob } from "../src/common/Blob";
import { RateLimiter } from "../src/common/RateLimiter";
import azureFunction from "../src/functions/v1/getConsumption";
import { mockBlob, MockBlobDescriptor } from "./MockBlob.mock";
import { mockRequest } from "./mockRequest.mock";

jest.mock("../src/common/Blob");
jest.mock("../src/common/RateLimiter");

RateLimiter.accept = jest.fn().mockReturnValue(true);

describe("Testing function api/v1/getConsumption", () => {
    const appId = "__mock__";
    const authBlobId = `${appId}/_authorization.json`;

    beforeAll(() => {
        (Blob as jest.Mock).mockClear();
    });

    it("Fails on missing appId", async () => {
        let { context, req } = mockRequest("GET");
        await azureFunction(context, req);
        expect(context.res.status).toBe(400);
    });

    it("Fails on missing authorization", async () => {
        let storage = {
            [authBlobId]: {
                key: "__mock_key__",
                valid: true,
            }
        };
        mockBlob(storage);
        let { context, req } = mockRequest("GET", { appId });
        await azureFunction(context, req);
        expect(context.res.status).toBe(401);
    });

    it("Fails on invalid authorization", async () => {
        let storage = {
            [authBlobId]: {
                key: "__mock_key__",
                valid: true,
            }
        };
        mockBlob(storage);
        let { context, req } = mockRequest("GET", { appId, authKey: "invalid" });
        await azureFunction(context, req);
        expect(context.res.status).toBe(401);
    });

    it("Fails on missing authorization", async () => {
        let storage = {
            [authBlobId]: {
                key: "__mock_key__",
                valid: true,
            }
        };
        mockBlob(storage);
        let { context, req } = mockRequest("GET", { appId, authKey: storage[authBlobId].key });
        await azureFunction(context, req);
        expect(context.res.status).toBe(200);
    });

    it("Fails on missing authorization", async () => {
        let storage = {
            [`${appId}/_ranges.json`]: [{ from: 1, to: 9 }],
            [`${appId}/codeunit.json`]: [1, 2, 3],
            [`${appId}/page.json`]: [4, 5, 6],
        };
        mockBlob(storage);
        let { context, req } = mockRequest("GET", { appId });
        await azureFunction(context, req);
        expect(context.res.status).toBe(200);
        expect(context.res.body).toBeDefined();
        expect(context.res.body.codeunit).toEqual(expect.arrayContaining([1, 2, 3]));
        expect(context.res.body.page).toEqual(expect.arrayContaining([4, 5, 6]));
        expect(context.res.body._ranges).toBeUndefined();
    });
});
