import { Blob } from "@vjeko.com/azure-blob";
import { createEndpoint } from "../../../src/http/createEndpoint";
import { ErrorResponse } from "../../../src/http/ErrorResponse";
import { HttpStatusCode } from "../../../src/http/HttpStatusCode";
import { AppCache } from "../../../src/cache";

jest.mock("@vjeko.com/azure-blob");
jest.mock("../../../src/http/createEndpoint");
jest.mock("../../../src/cache");

const mockCreateEndpoint = createEndpoint as jest.MockedFunction<typeof createEndpoint>;

let endpointConfig: any;
mockCreateEndpoint.mockImplementation((config: any) => {
    endpointConfig = config;
});

import "../../../src/functions/v3/check";

describe("check", () => {
    const MockBlob = Blob as jest.MockedClass<typeof Blob>;
    const mockAppCache = AppCache as jest.Mocked<typeof AppCache>;

    let mockBlobInstance: {
        read: jest.Mock;
    };

    const createMockRequest = (body: any) => ({
        params: {},
        headers: {
            get: jest.fn().mockReturnValue(null),
        },
        body,
        markAsChanged: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockBlobInstance = {
            read: jest.fn().mockResolvedValue(null),
        };

        MockBlob.mockImplementation(() => mockBlobInstance as any);
        mockAppCache.get.mockReturnValue(undefined);
        // getLogs is now async - returns logs from cache/blob
        mockAppCache.getLogs.mockResolvedValue([]);
    });

    describe("endpoint configuration", () => {
        it("should create endpoint with correct moniker", () => {
            expect(endpointConfig.moniker).toBe("v3-check");
        });

        it("should create endpoint with correct route", () => {
            expect(endpointConfig.route).toBe("v3/check");
        });

        it("should create endpoint with undefined auth level", () => {
            expect(endpointConfig.authLevel).toBeUndefined();
        });

        it("should register POST handler", () => {
            expect(endpointConfig.POST).toBeDefined();
        });

        it("should not register GET, PUT, PATCH, or DELETE handlers", () => {
            expect(endpointConfig.GET).toBeUndefined();
            expect(endpointConfig.PUT).toBeUndefined();
            expect(endpointConfig.PATCH).toBeUndefined();
            expect(endpointConfig.DELETE).toBeUndefined();
        });
    });

    describe("POST handler - single app request", () => {
        it("should return app data for existing app without authorization", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                table: [100, 200],
                _ranges: [{ from: 1, to: 1000 }],
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"].codeunit).toEqual([1, 2, 3]);
            expect(result["test-app"].table).toEqual([100, 200]);
            expect(result["test-app"]._ranges).toEqual([{ from: 1, to: 1000 }]);
            expect(result["test-app"]._log).toEqual([]);
        });

        it("should return empty object with empty logs for non-existent app", async () => {
            mockBlobInstance.read.mockResolvedValue(null);
            const request = createMockRequest({ appId: "non-existent-app" });

            const result = await endpointConfig.POST(request);

            expect(result["non-existent-app"]).toEqual({ _log: [] });
        });

        it("should strip _authorization from response", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                _authorization: { key: "secret-key" },
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app", authKey: "secret-key" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"].codeunit).toEqual([1, 2, 3]);
            expect(result["test-app"]._authorization).toBeUndefined();
        });

        it("should return app data when authKey matches", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                _authorization: { key: "correct-key" },
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app", authKey: "correct-key" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"].codeunit).toEqual([1, 2, 3]);
        });

        it("should throw 401 when single unauthorized app", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                _authorization: { key: "correct-key" },
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app", authKey: "wrong-key" });

            await expect(endpointConfig.POST(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.POST(request)).rejects.toMatchObject({
                message: "Invalid authorization key",
                statusCode: HttpStatusCode.ClientError_401_Unauthorized,
            });
        });

        it("should throw 401 when single app with no authKey but app requires it", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                _authorization: { key: "correct-key" },
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app" });

            await expect(endpointConfig.POST(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.POST(request)).rejects.toMatchObject({
                statusCode: HttpStatusCode.ClientError_401_Unauthorized,
            });
        });

        it("should return app data when no authorization key exists", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                _authorization: {} as any,
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"].codeunit).toEqual([1, 2, 3]);
        });

        it("should call Blob with correct path", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({ appId: "my-app-id" });

            await endpointConfig.POST(request);

            expect(MockBlob).toHaveBeenCalledWith("apps://my-app-id.json");
        });
    });

    describe("POST handler - multiple apps request", () => {
        it("should return data for multiple apps", async () => {
            const app1Data = { codeunit: [1, 2] };
            const app2Data = { table: [100, 200] };
            mockBlobInstance.read
                .mockResolvedValueOnce(app1Data)
                .mockResolvedValueOnce(app2Data);
            const request = createMockRequest([
                { appId: "app-1" },
                { appId: "app-2" },
            ]);

            const result = await endpointConfig.POST(request);

            expect(result["app-1"].codeunit).toEqual([1, 2]);
            expect(result["app-2"].table).toEqual([100, 200]);
        });

        it("should filter out unauthorized apps without error", async () => {
            const app1Data = { codeunit: [1, 2] };
            const app2Data = { table: [100], _authorization: { key: "secret" } };
            mockBlobInstance.read
                .mockResolvedValueOnce(app1Data)
                .mockResolvedValueOnce(app2Data);
            const request = createMockRequest([
                { appId: "app-1" },
                { appId: "app-2", authKey: "wrong-key" },
            ]);

            const result = await endpointConfig.POST(request);

            expect(result["app-1"].codeunit).toEqual([1, 2]);
            expect(result["app-2"]).toBeUndefined();
        });

        it("should return empty object for non-existent apps in array", async () => {
            mockBlobInstance.read
                .mockResolvedValueOnce({ codeunit: [1] })
                .mockResolvedValueOnce(null);
            const request = createMockRequest([
                { appId: "existing-app" },
                { appId: "missing-app" },
            ]);

            const result = await endpointConfig.POST(request);

            expect(result["existing-app"].codeunit).toEqual([1]);
            expect(result["missing-app"]).toEqual({ _log: [] });
        });

        it("should return empty object when all apps unauthorized", async () => {
            const appData = { _authorization: { key: "secret" } };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest([
                { appId: "app-1", authKey: "wrong" },
                { appId: "app-2", authKey: "also-wrong" },
            ]);

            const result = await endpointConfig.POST(request);

            expect(result).toEqual({});
        });

        it("should handle mix of authorized, unauthorized, and non-existent apps", async () => {
            const authorizedApp = { codeunit: [1, 2, 3] };
            const unauthorizedApp = { table: [100], _authorization: { key: "secret" } };
            const nonExistentApp = null;
            mockBlobInstance.read
                .mockResolvedValueOnce(authorizedApp)
                .mockResolvedValueOnce(unauthorizedApp)
                .mockResolvedValueOnce(nonExistentApp);
            const request = createMockRequest([
                { appId: "authorized-app" },
                { appId: "unauthorized-app", authKey: "wrong-key" },
                { appId: "non-existent-app" },
            ]);

            const result = await endpointConfig.POST(request);

            expect(result["authorized-app"].codeunit).toEqual([1, 2, 3]);
            expect(result["unauthorized-app"]).toBeUndefined();
            expect(result["non-existent-app"]).toEqual({ _log: [] });
        });

        it("should strip _authorization from all responses", async () => {
            const app1Data = { codeunit: [1], _authorization: { key: "key1" } };
            const app2Data = { table: [100], _authorization: { key: "key2" } };
            mockBlobInstance.read
                .mockResolvedValueOnce(app1Data)
                .mockResolvedValueOnce(app2Data);
            const request = createMockRequest([
                { appId: "app-1", authKey: "key1" },
                { appId: "app-2", authKey: "key2" },
            ]);

            const result = await endpointConfig.POST(request);

            expect(result["app-1"]._authorization).toBeUndefined();
            expect(result["app-2"]._authorization).toBeUndefined();
        });

        it("should allow apps without authorization key", async () => {
            const appData = { codeunit: [1], _authorization: {} as any };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest([
                { appId: "app-1" },
                { appId: "app-2" },
            ]);

            const result = await endpointConfig.POST(request);

            expect(result["app-1"].codeunit).toEqual([1]);
            expect(result["app-2"].codeunit).toEqual([1]);
        });

        it("should read each app from blob storage", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest([
                { appId: "app-1" },
                { appId: "app-2" },
                { appId: "app-3" },
            ]);

            await endpointConfig.POST(request);

            // Only app blobs - log blobs are handled by AppCache internally
            expect(MockBlob).toHaveBeenCalledTimes(3);
            expect(MockBlob).toHaveBeenCalledWith("apps://app-1.json");
            expect(MockBlob).toHaveBeenCalledWith("apps://app-2.json");
            expect(MockBlob).toHaveBeenCalledWith("apps://app-3.json");
        });
    });

    describe("cache interactions", () => {
        it("should return cached app data without reading app from blob", async () => {
            const cachedData = { codeunit: [1, 2, 3] };
            mockAppCache.get.mockReturnValue(cachedData);
            const request = createMockRequest({ appId: "cached-app" });

            const result = await endpointConfig.POST(request);

            expect(mockAppCache.get).toHaveBeenCalledWith("cached-app");
            expect(result["cached-app"].codeunit).toEqual([1, 2, 3]);
        });

        it("should read app from blob and populate cache when not cached", async () => {
            const blobData = { table: [50000, 50001] };
            mockAppCache.get.mockReturnValue(undefined);
            mockBlobInstance.read.mockResolvedValue(blobData);
            const request = createMockRequest({ appId: "uncached-app" });

            const result = await endpointConfig.POST(request);

            expect(mockAppCache.get).toHaveBeenCalledWith("uncached-app");
            expect(mockAppCache.set).toHaveBeenCalledWith("uncached-app", blobData);
            expect(result["uncached-app"].table).toEqual([50000, 50001]);
        });

        it("should not populate app cache for non-existent app", async () => {
            mockAppCache.get.mockReturnValue(undefined);
            mockBlobInstance.read.mockResolvedValue(null);
            const request = createMockRequest({ appId: "non-existent" });

            const result = await endpointConfig.POST(request);

            expect(mockAppCache.set).not.toHaveBeenCalled();
            expect(result["non-existent"]).toEqual({ _log: [] });
        });

        it("should check cache for each app in array request", async () => {
            const app1Data = { codeunit: [1] };
            const app2Data = { table: [100] };
            mockAppCache.get
                .mockReturnValueOnce(app1Data)
                .mockReturnValueOnce(undefined);
            mockBlobInstance.read.mockResolvedValue(app2Data);
            const request = createMockRequest([
                { appId: "cached-app" },
                { appId: "uncached-app" },
            ]);

            const result = await endpointConfig.POST(request);

            expect(mockAppCache.get).toHaveBeenCalledWith("cached-app");
            expect(mockAppCache.get).toHaveBeenCalledWith("uncached-app");
            expect(result["cached-app"].codeunit).toEqual([1]);
            expect(result["uncached-app"].table).toEqual([100]);
        });

        it("should populate cache for each uncached app from blob", async () => {
            mockAppCache.get.mockReturnValue(undefined);
            const app1Data = { codeunit: [1] };
            const app2Data = { table: [100] };
            mockBlobInstance.read
                .mockResolvedValueOnce(app1Data)
                .mockResolvedValueOnce(app2Data);
            const request = createMockRequest([
                { appId: "app-1" },
                { appId: "app-2" },
            ]);

            await endpointConfig.POST(request);

            expect(mockAppCache.set).toHaveBeenCalledWith("app-1", app1Data);
            expect(mockAppCache.set).toHaveBeenCalledWith("app-2", app2Data);
        });

        it("should handle cached app with authorization correctly", async () => {
            const cachedData = {
                codeunit: [1, 2, 3],
                _authorization: { key: "secret-key" },
            } as any;
            mockAppCache.get.mockReturnValue(cachedData);
            const request = createMockRequest({ appId: "cached-app", authKey: "secret-key" });

            const result = await endpointConfig.POST(request);

            expect(result["cached-app"].codeunit).toEqual([1, 2, 3]);
            expect(result["cached-app"]._authorization).toBeUndefined();
        });

        it("should throw 401 for cached app with wrong authKey", async () => {
            const cachedData = {
                codeunit: [1, 2, 3],
                _authorization: { key: "correct-key" },
            } as any;
            mockAppCache.get.mockReturnValue(cachedData);
            const request = createMockRequest({ appId: "cached-app", authKey: "wrong-key" });

            await expect(endpointConfig.POST(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.POST(request)).rejects.toMatchObject({
                statusCode: HttpStatusCode.ClientError_401_Unauthorized,
            });
        });
    });

    describe("authorization logic", () => {
        it("should authorize when app has no _authorization property", async () => {
            const appData = { codeunit: [1, 2, 3] };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"].codeunit).toEqual([1, 2, 3]);
        });

        it("should authorize when no authorization key exists", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                _authorization: {} as any,
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"].codeunit).toEqual([1, 2, 3]);
        });

        it("should authorize when authKey matches exactly", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                _authorization: { key: "exact-match-key" },
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app", authKey: "exact-match-key" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"].codeunit).toEqual([1, 2, 3]);
        });

        it("should reject when authKey does not match", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                _authorization: { key: "correct-key" },
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app", authKey: "incorrect-key" });

            await expect(endpointConfig.POST(request)).rejects.toThrow(ErrorResponse);
        });

        it("should reject when no authKey provided but required", async () => {
            const appData = {
                codeunit: [1, 2, 3],
                _authorization: { key: "required-key" },
            };
            mockBlobInstance.read.mockResolvedValue(appData);
            const request = createMockRequest({ appId: "test-app" });

            await expect(endpointConfig.POST(request)).rejects.toThrow(ErrorResponse);
        });
    });

    describe("log caching", () => {
        it("should get logs from AppCache", async () => {
            const appData = { codeunit: [1, 2, 3] };
            const logs = [
                { eventType: "syncFull", timestamp: Date.now(), user: "test-user", data: null },
            ];
            mockAppCache.get.mockReturnValue(appData);
            mockAppCache.getLogs.mockResolvedValue(logs);
            const request = createMockRequest({ appId: "test-app" });

            const result = await endpointConfig.POST(request);

            expect(mockAppCache.getLogs).toHaveBeenCalledWith("test-app");
            expect(result["test-app"]._log).toEqual(logs);
        });

        it("should return empty logs when AppCache returns empty", async () => {
            const appData = { codeunit: [1, 2, 3] };
            mockAppCache.get.mockReturnValue(appData);
            mockAppCache.getLogs.mockResolvedValue([]);
            const request = createMockRequest({ appId: "test-app" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"]._log).toEqual([]);
        });

        it("should filter out logs older than 2 hours", async () => {
            const appData = { codeunit: [1, 2, 3] };
            const now = 1234567890000; // Fixed timestamp to avoid timing issues
            const twoHoursAgo = now - 2 * 60 * 60 * 1000;
            const logs = [
                { eventType: "old", timestamp: twoHoursAgo - 1000, user: "user1", data: null },
                { eventType: "recent", timestamp: now - 1000, user: "user2", data: null },
                { eventType: "veryOld", timestamp: twoHoursAgo - 60000, user: "user3", data: null },
            ];
            
            // Mock Date.now() to return consistent time
            jest.spyOn(Date, "now").mockReturnValue(now);
            
            mockAppCache.get.mockReturnValue(appData);
            mockAppCache.getLogs.mockResolvedValue(logs);
            const request = createMockRequest({ appId: "test-app" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"]._log).toHaveLength(1);
            expect(result["test-app"]._log[0].eventType).toBe("recent");
            
            // Restore Date.now() after test
            jest.restoreAllMocks();
        });

        it("should include logs exactly at 2 hour boundary", async () => {
            const appData = { codeunit: [1, 2, 3] };
            const now = 1234567890000; // Fixed timestamp to avoid timing issues
            const twoHoursAgo = now - 2 * 60 * 60 * 1000;
            const logs = [
                { eventType: "boundary", timestamp: twoHoursAgo, user: "user1", data: null },
            ];
            
            // Mock Date.now() to return consistent time
            jest.spyOn(Date, "now").mockReturnValue(now);
            
            mockAppCache.get.mockReturnValue(appData);
            mockAppCache.getLogs.mockResolvedValue(logs);
            const request = createMockRequest({ appId: "test-app" });

            const result = await endpointConfig.POST(request);

            expect(result["test-app"]._log).toHaveLength(1);
            expect(result["test-app"]._log[0].eventType).toBe("boundary");
            
            // Restore Date.now() after test
            jest.restoreAllMocks();
        });

        it("should fetch logs for each app in array request", async () => {
            const app1Data = { codeunit: [1] };
            const app2Data = { table: [100] };
            const logs1 = [{ eventType: "log1", timestamp: Date.now(), user: "u1", data: null }];
            const logs2 = [{ eventType: "log2", timestamp: Date.now(), user: "u2", data: null }];

            mockAppCache.get
                .mockReturnValueOnce(app1Data)
                .mockReturnValueOnce(app2Data);
            mockAppCache.getLogs
                .mockResolvedValueOnce(logs1)
                .mockResolvedValueOnce(logs2);

            const request = createMockRequest([
                { appId: "app-1" },
                { appId: "app-2" },
            ]);

            const result = await endpointConfig.POST(request);

            expect(mockAppCache.getLogs).toHaveBeenCalledWith("app-1");
            expect(mockAppCache.getLogs).toHaveBeenCalledWith("app-2");
            expect(result["app-1"]._log).toEqual(logs1);
            expect(result["app-2"]._log).toEqual(logs2);
        });
    });
});

