import { Blob } from "../src/common/Blob";
import { RateLimiter } from "../src/common/RateLimiter";
import azureFunction from "../src/functions/v1/authorizeApp";
import { mockBlob, MockBlobDescriptor } from "./MockBlob.mock";
import { mockRequest } from "./mockRequest.mock";

jest.mock("../src/common/Blob");
jest.mock("../src/common/RateLimiter");

RateLimiter.accept = jest.fn().mockReturnValue(true);

describe("Testing function api/v1/authorizeApp", () => {
    const appId = "__mock__";
    const authBlobId = `${appId}/_authorization.json`;

    beforeAll(() => {
        (Blob as jest.Mock).mockClear();
    });

    it("Fails on missing appId", async () => {
        let { context, req } = mockRequest("POST");
        await azureFunction(context, req);
        expect(context.res.status).toBe(400);
    });

    it("Fails on already authorized", async () => {
        let storage = {
            [authBlobId]: {
                key: "__mock_key__",
                valid: true,
            }
        };
        let api = {} as MockBlobDescriptor;
        mockBlob(storage, api);

        let { context, req } = mockRequest("POST", { appId });
        await azureFunction(context, req);

        expect(api.constructor).toBeCalledWith(authBlobId);
        expect(api.read).toBeCalledTimes(1);
        expect(api.optimisticUpdate).not.toBeCalled();
        expect(context.res.status).toBe(405);
    });

    it("Authorizes a previously unauthorized app", async () => {
        let api = {} as MockBlobDescriptor;
        let storage = {};
        mockBlob(storage, api);

        let { context, req } = mockRequest("POST", { appId });
        await azureFunction(context, req);

        expect(api.constructor).toBeCalledWith(authBlobId);
        expect(api.read).toBeCalledTimes(1);
        expect(api.optimisticUpdate).toBeCalledTimes(1);
        expect(storage[authBlobId].valid).toEqual(true);
        expect(storage[authBlobId].key).toBeDefined();
        expect(context.res.status).toBe(200);
    });

    it("Fails to de-authorize a previously unauthorized app", async () => {
        let api = {} as MockBlobDescriptor;
        mockBlob({}, api);

        let { context, req } = mockRequest("DELETE", { appId });
        await azureFunction(context, req);

        expect(api.constructor).toBeCalledWith(authBlobId);
        expect(api.read).toBeCalledTimes(1);
        expect(api.delete).not.toBeCalled();
        expect(context.res.status).toBe(405);
    });

    it("Fails to de-authorize an app with an invalid authorization key", async () => {
        let api = {} as MockBlobDescriptor;
        mockBlob({ [authBlobId]: { key: "__mock_1__", valid: true } }, api);

        let { context, req } = mockRequest("DELETE", { appId, authKey: "__mock_2__" });
        await azureFunction(context, req);

        expect(api.constructor).toBeCalledWith(authBlobId);
        expect(api.read).toBeCalledTimes(1);
        expect(api.delete).not.toBeCalled();
        expect(context.res.status).toBe(401);
    });

    it("De-authorizes a previously authorized app", async () => {
        let api = {} as MockBlobDescriptor;
        let storage = { 
            [authBlobId]: { key: "__mock_1__", valid: true },
            "app2": { key: "key", valid: true },
        };
        mockBlob(storage, api);

        let { context, req } = mockRequest("DELETE", { appId, authKey: "__mock_1__" });
        await azureFunction(context, req);

        expect(api.constructor).toBeCalledWith(authBlobId);
        expect(api.read).toBeCalledTimes(1);
        expect(api.optimisticUpdate).not.toBeCalled();
        expect(api.delete).toBeCalledTimes(1);
        expect(storage[authBlobId]).toBeUndefined();
        expect(storage.app2).toBeDefined();
        expect(context.res.status).toBe(200);
    });

    it("Fails to delete authorization blob during de-authorization call", async () => {
        let api = {} as MockBlobDescriptor;
        let storage = { 
            [authBlobId]: { key: "__mock_1__", valid: true },
            "app2": { key: "key", valid: true },
        };
        mockBlob(storage, api);
        api.canDelete = false;

        let { context, req } = mockRequest("DELETE", { appId, authKey: "__mock_1__" });
        await azureFunction(context, req);

        expect(api.constructor).toBeCalledWith(authBlobId);
        expect(api.read).toBeCalledTimes(1);
        expect(api.optimisticUpdate).not.toBeCalled();
        expect(api.delete).toBeCalledTimes(1);
        expect(context.res.status).toBe(400);
    });
});
