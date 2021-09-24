import { Blob } from "../src/common/Blob";
import { RateLimiter } from "../src/common/RateLimiter";
import azureFunction from "../src/functions/v1/autoSyncIds";
import { mockBlob, MockBlobDescriptor } from "./MockBlob.mock";
import { mockRequest } from "./mockRequest.mock";

jest.mock("../src/common/Blob");
jest.mock("../src/common/RateLimiter");

RateLimiter.accept = jest.fn().mockReturnValue(true);

describe("Testing function api/v1/autoSyncIds", () => {
    const appId = "__mock__";
    const authBlobId = `${appId}/_authorization.json`;

    beforeAll(() => {
        (Blob as jest.Mock).mockClear();
    });

    it("Fails on missing appFolders", async() => {
        let { context, req } = mockRequest("POST");
        await azureFunction(context, req);
        expect(context.res.status).toBe(400);
    });

    it("Fails on invalid appFolders property type", async() => {
        let { context, req } = mockRequest("POST", { appFolders: 0 });
        await azureFunction(context, req);
        expect(context.res.status).toBe(400);
    });

    it("Fails on invalid appFolders missing ids", async() => {
        let { context, req } = mockRequest("POST", { appFolders: [ {}, {} ] });
        await azureFunction(context, req);
        expect(context.res.status).toBe(400);
    });

    it("Fails on invalid appFolders ids not object", async() => {
        let { context, req } = mockRequest("POST", { appFolders: [ { appId: "0", ids: 1 }, { appId: "1", ids: 1 } ] });
        await azureFunction(context, req);
        expect(context.res.status).toBe(400);
    });

    it("Fails on invalid appFolders ids invalid object type", async() => {
        let { context, req } = mockRequest("POST", { appFolders: [ { appId: "0", ids: { interface: [1, 2, 3] } }, { appId: "1", ids: { interface: [1, 2, 3] } } ] });
        await azureFunction(context, req);
        expect(context.res.status).toBe(400);
    });

    it("Fails on invalid appFolders ids not numbers", async() => {
        let { context, req } = mockRequest("POST", { appFolders: [ { appId: "0", ids: { codeunit: ["1", "2", "3"] } }, { appId: "1", ids: { codeunit: ["1", "2", "3"] } } ] });
        await azureFunction(context, req);
        expect(context.res.status).toBe(400);
    });

    it("Does not update blob on unauthorized request", async() => {
        let storage = {
            [authBlobId]: {
                key: "__mock_key__",
                valid: true,
            }
        };
        let api = {} as MockBlobDescriptor;
        mockBlob(storage, api);
        let { context, req } = mockRequest("POST", { appFolders: [ { appId, ids: { codeunit: [1, 2, 3] } } ] });
        await azureFunction(context, req);
        expect(api.optimisticUpdate).not.toBeCalled();
        expect(context.res.status).toBe(200);
    });

    it("Overwrites blob on authorized request", async() => {
        let storage = {
            [authBlobId]: {
                key: "__mock_key__",
                valid: true,
            },
            [`${appId}/codeunit.json`]: [4, 5, 6],
        };
        let api = {} as MockBlobDescriptor;
        mockBlob(storage, api);
        let { context, req } = mockRequest("POST", { appFolders: [ { appId, authKey: "__mock_key__", ids: { codeunit: [1, 2, 3] } } ] });
        await azureFunction(context, req);
        expect(api.optimisticUpdate).toBeCalled();
        expect(storage[`${appId}/codeunit.json`]).toEqual(expect.arrayContaining([1, 2, 3]));
        expect(storage[`${appId}/page.json`]).toEqual(expect.arrayContaining([]));
        expect(context.res.status).toBe(200);
    });

    it("Merges blob on patch request", async() => {
        let storage = {
            [authBlobId]: {
                key: "__mock_key__",
                valid: true,
            },
            [`${appId}/codeunit.json`]: [4, 5, 6],
        };
        let api = {} as MockBlobDescriptor;
        mockBlob(storage, api);
        let { context, req } = mockRequest("PATCH", { appFolders: [ { appId, authKey: "__mock_key__", ids: { codeunit: [1, 2, 3] } } ] });
        await azureFunction(context, req);
        expect(api.optimisticUpdate).toBeCalled();
        expect(storage[`${appId}/codeunit.json`]).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6]));
        expect(context.res.status).toBe(200);
    });

});
