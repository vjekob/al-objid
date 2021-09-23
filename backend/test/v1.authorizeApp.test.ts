import { AppAuthorization } from "../src/common/AppAuthorization";
import { Blob } from "../src/common/Blob";
import { RateLimiter } from "../src/common/RateLimiter";
import azureFunction from "../src/functions/v1/authorizeApp";
import { mockBlob } from "./MockBlob.mock";
import { mockRequest } from "./mockRequest.mock";

jest.mock("../src/common/Blob");
jest.mock("../src/common/RateLimiter");

RateLimiter.accept = jest.fn().mockReturnValue(true);

describe("Testing function api/v1/authorizeApp", () => {
    beforeAll(() => {
        (Blob as jest.Mock).mockClear();
    });

    it("Fails on missing appId", async () => {
        let { context, req } = mockRequest("POST");
        await azureFunction(context, req);
        expect(context.res.status).toBe(400);
    });

    it("Fails on already authorized", async () => {
        let blob = mockBlob({ read: async () => ({ key: "__mock_key__", valid: true }) });

        let { context, req } = mockRequest("POST", { appId: "__mock__" });
        await azureFunction(context, req);
        expect(blob.constructor).toBeCalledWith("__mock__/_authorization.json");
        expect(blob.read).toBeCalledTimes(1);
        expect(blob.optimisticUpdate).not.toBeCalled();
        expect(context.res.status).toBe(405);
    });

    it("Authorizes a previously unauthorized app", async () => {
        let auth: AppAuthorization;
        let blob = mockBlob({ optimisticUpdate: value => auth = value() });
        let { context, req } = mockRequest("POST", { appId: "__mock__" });
        await azureFunction(context, req);
        expect(blob.constructor).toBeCalledWith("__mock__/_authorization.json");
        expect(blob.read).toBeCalledTimes(1);
        expect(blob.optimisticUpdate).toBeCalledTimes(1);
        expect(auth.valid).toEqual(true);
        expect(auth.key).toBeDefined();
        expect(context.res.status).toBe(200);
    });

    it("Fails to de-authorize a previously unauthorized app", async () => {
        let blob = mockBlob();
        let { context, req } = mockRequest("DELETE", { appId: "__mock__" });
        await azureFunction(context, req);
        expect(blob.constructor).toBeCalledWith("__mock__/_authorization.json");
        expect(blob.read).toBeCalledTimes(1);
        expect(context.res.status).toBe(405);
    });

    it("Fails to de-authorize an app with an invalid authorization key", async () => {
        let blob = mockBlob({ read: () => ({ key: "__mock_1__", valid: true }) });
        let { context, req } = mockRequest("DELETE", { appId: "__mock__", authKey: "__mock_2__" });
        await azureFunction(context, req);
        expect(blob.constructor).toBeCalledWith("__mock__/_authorization.json");
        expect(blob.read).toBeCalledTimes(1);
        expect(context.res.status).toBe(401);
    });

    it("De-authorizes a previously authorized app", async () => {
        let blob = mockBlob({ read: () => ({ key: "__mock_1__", valid: true }), delete: () => true });
        let { context, req } = mockRequest("DELETE", { appId: "__mock__", authKey: "__mock_1__" });
        await azureFunction(context, req);
        expect(blob.constructor).toBeCalledWith("__mock__/_authorization.json");
        expect(blob.read).toBeCalledTimes(1);
        expect(blob.optimisticUpdate).not.toBeCalled();
        expect(blob.delete).toBeCalledTimes(1);
        expect(context.res.status).toBe(200);
    });

    it("Fails to delete authorization blob during de-authorization call", async () => {
        let blob = mockBlob({ read: () => ({ key: "__mock_1__", valid: true }) });
        let { context, req } = mockRequest("DELETE", { appId: "__mock__", authKey: "__mock_1__" });
        await azureFunction(context, req);
        expect(blob.constructor).toBeCalledWith("__mock__/_authorization.json");
        expect(blob.read).toBeCalledTimes(1);
        expect(blob.optimisticUpdate).not.toBeCalled();
        expect(blob.delete).toBeCalledTimes(1);
        expect(context.res.status).toBe(400);
    });
});
