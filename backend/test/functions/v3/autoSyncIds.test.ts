import { Blob } from "@vjeko.com/azure-blob";
import { createEndpoint } from "../../../src/http/createEndpoint";
import { AppBinding, UserInfo } from "../../../src/http";
import { AppCache } from "../../../src/cache";
import * as loggingModule from "../../../src/utils/logging";

jest.mock("@vjeko.com/azure-blob");
jest.mock("../../../src/http/createEndpoint");
jest.mock("../../../src/cache");
jest.mock("../../../src/utils/logging");

const mockCreateEndpoint = createEndpoint as jest.MockedFunction<typeof createEndpoint>;

let endpointConfig: any;
mockCreateEndpoint.mockImplementation((config: any) => {
    endpointConfig = config;
});

import "../../../src/functions/v3/autoSyncIds";

describe("autoSyncIds", () => {
    const MockBlob = Blob as jest.MockedClass<typeof Blob>;
    const mockAppCache = AppCache as jest.Mocked<typeof AppCache>;
    const mockLogAppEvent = loggingModule.logAppEvent as jest.MockedFunction<typeof loggingModule.logAppEvent>;

    let mockBlobInstance: {
        read: jest.Mock;
        exists: jest.Mock;
        optimisticUpdate: jest.Mock;
    };

    /**
     * Creates a mock request that simulates MultiAppHttpRequest.
     * The `apps` array represents already-bound app data (as done by bindMultiApp).
     */
    const createMockRequest = (apps: AppBinding[] = [], user?: UserInfo) => ({
        params: {},
        headers: {
            get: jest.fn().mockReturnValue(null),
        },
        body: apps.map(a => ({ appId: a.id, ...a.data })),
        apps,
        user,
        markAsChanged: jest.fn(),
    });

    const createAppBinding = (id: string, data: any, app: any = null): AppBinding => {
        const blob = new MockBlob(`apps://${id}.json`) as any;
        blob.optimisticUpdate = mockBlobInstance.optimisticUpdate;
        return {
            id,
            app: app || {},
            blob,
            data,
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockBlobInstance = {
            read: jest.fn(),
            exists: jest.fn(),
            optimisticUpdate: jest.fn(),
        };

        MockBlob.mockImplementation(() => mockBlobInstance as any);
        mockLogAppEvent.mockResolvedValue(undefined);
    });

    describe("endpoint configuration", () => {
        it("should create endpoint with correct moniker", () => {
            expect(endpointConfig.moniker).toBe("v3-autoSyncIds");
        });

        it("should create endpoint with correct route", () => {
            expect(endpointConfig.route).toBe("v3/autoSyncIds");
        });

        it("should create endpoint with undefined auth level", () => {
            expect(endpointConfig.authLevel).toBeUndefined();
        });

        it("should register POST and PATCH handlers", () => {
            expect(endpointConfig.POST).toBeDefined();
            expect(endpointConfig.PATCH).toBeDefined();
        });
    });

    describe("POST handler - full replacement sync", () => {
        it("should process multiple apps via req.apps", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [1, 2, 3] } }),
                createAppBinding("app-2", { ids: { table: [100, 200] } }),
            ];
            const request = createMockRequest(apps);

            const result = await endpointConfig.POST(request);

            expect(result["app-1"]).toEqual({ codeunit: [1, 2, 3] });
            expect(result["app-2"]).toEqual({ table: [100, 200] });
        });

        it("should sort consumptions in ascending order", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [5, 1, 3, 2, 4] } }),
            ];
            const request = createMockRequest(apps);

            const result = await endpointConfig.POST(request);

            expect(result["app-1"].codeunit).toEqual([1, 2, 3, 4, 5]);
        });

        it("should return consumptions for multiple apps", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [1, 2] } }),
                createAppBinding("app-2", { ids: { table: [100] } }),
                createAppBinding("app-3", { ids: { page: [50, 51] } }),
            ];
            const request = createMockRequest(apps);

            const result = await endpointConfig.POST(request);

            expect(result["app-1"]).toEqual({ codeunit: [1, 2] });
            expect(result["app-2"]).toEqual({ table: [100] });
            expect(result["app-3"]).toEqual({ page: [50, 51] });
        });

        it("should handle empty apps array", async () => {
            const request = createMockRequest([]);

            const result = await endpointConfig.POST(request);

            expect(result).toEqual({});
        });

        it("should strip internal properties from response", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => ({
                ...fn(null),
                _authorization: { key: "test" },
                _ranges: [{ from: 1, to: 100 }],
            }));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [1, 2, 3] } }),
            ];
            const request = createMockRequest(apps);

            const result = await endpointConfig.POST(request);

            expect(result["app-1"]).toEqual({ codeunit: [1, 2, 3] });
            expect(result["app-1"]._authorization).toBeUndefined();
            expect(result["app-1"]._ranges).toBeUndefined();
        });
    });

    describe("PATCH handler - merge sync", () => {
        it("should merge with existing consumptions", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    codeunit: [1, 2, 3],
                    table: [10, 20],
                });
            });
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [5, 6] } }),
            ];
            const request = createMockRequest(apps);

            await endpointConfig.PATCH(request);

            const existingApp = {
                codeunit: [1, 2, 3],
                table: [10, 20],
            };
            const result = capturedUpdateFn!(existingApp);
            expect(result.codeunit).toEqual([1, 2, 3, 5, 6]);
            expect(result.table).toEqual([10, 20]);
        });

        it("should deduplicate when merging", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    codeunit: [1, 2, 3],
                });
            });
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [2, 3, 4] } }),
            ];
            const request = createMockRequest(apps);

            await endpointConfig.PATCH(request);

            const existingApp = {
                codeunit: [1, 2, 3],
            };
            const result = capturedUpdateFn!(existingApp);
            expect(result.codeunit).toEqual([1, 2, 3, 4]);
        });

        it("should add new object types when merging", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    codeunit: [1, 2, 3],
                });
            });
            const apps = [
                createAppBinding("app-1", { ids: { table: [100, 200] } }),
            ];
            const request = createMockRequest(apps);

            await endpointConfig.PATCH(request);

            const existingApp = {
                codeunit: [1, 2, 3],
            };
            const result = capturedUpdateFn!(existingApp);
            expect(result.codeunit).toEqual([1, 2, 3]);
            expect(result.table).toEqual([100, 200]);
        });

        it("should process multiple apps", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [1, 2] } }),
                createAppBinding("app-2", { ids: { table: [100] } }),
            ];
            const request = createMockRequest(apps);

            const result = await endpointConfig.PATCH(request);

            expect(result["app-1"]).toEqual({ codeunit: [1, 2] });
            expect(result["app-2"]).toEqual({ table: [100] });
        });
    });

    describe("cache interactions", () => {
        it("should update cache for each app after POST sync", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [1, 2] } }),
                createAppBinding("app-2", { ids: { table: [100] } }),
            ];
            const request = createMockRequest(apps);

            await endpointConfig.POST(request);

            expect(mockAppCache.set).toHaveBeenCalledTimes(2);
            expect(mockAppCache.set).toHaveBeenCalledWith("app-1", expect.any(Object));
            expect(mockAppCache.set).toHaveBeenCalledWith("app-2", expect.any(Object));
        });

        it("should update cache for each app after PATCH sync", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [1, 2] } }),
                createAppBinding("app-2", { ids: { table: [100] } }),
            ];
            const request = createMockRequest(apps);

            await endpointConfig.PATCH(request);

            expect(mockAppCache.set).toHaveBeenCalledTimes(2);
            expect(mockAppCache.set).toHaveBeenCalledWith("app-1", expect.any(Object));
            expect(mockAppCache.set).toHaveBeenCalledWith("app-2", expect.any(Object));
        });

        it("should not update cache when apps array is empty", async () => {
            const request = createMockRequest([]);

            await endpointConfig.POST(request);

            expect(mockAppCache.set).not.toHaveBeenCalled();
        });
    });

    describe("logging interactions", () => {
        it("should call logAppEvent with syncFull event and req.user for each app in POST", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [1, 2] } }),
                createAppBinding("app-2", { ids: { table: [100] } }),
            ];
            const request = createMockRequest(apps, testUser);

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledTimes(2);
            expect(mockLogAppEvent).toHaveBeenCalledWith("app-1", "syncFull", testUser);
            expect(mockLogAppEvent).toHaveBeenCalledWith("app-2", "syncFull", testUser);
        });

        it("should call logAppEvent with syncMerge event and req.user for each app in PATCH", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [1, 2] } }),
                createAppBinding("app-2", { ids: { table: [100] } }),
            ];
            const request = createMockRequest(apps, testUser);

            await endpointConfig.PATCH(request);

            expect(mockLogAppEvent).toHaveBeenCalledTimes(2);
            expect(mockLogAppEvent).toHaveBeenCalledWith("app-1", "syncMerge", testUser);
            expect(mockLogAppEvent).toHaveBeenCalledWith("app-2", "syncMerge", testUser);
        });

        it("should not call logAppEvent when apps array is empty", async () => {
            const request = createMockRequest([]);

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).not.toHaveBeenCalled();
        });

        it("should call logAppEvent with undefined user when req.user is undefined", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const apps = [
                createAppBinding("app-1", { ids: { codeunit: [1, 2] } }),
            ];
            const request = createMockRequest(apps, undefined);

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith("app-1", "syncFull", undefined);
        });
    });
});
