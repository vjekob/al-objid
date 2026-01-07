import { Blob } from "@vjeko.com/azure-blob";
import { createEndpoint } from "../../../src/http/createEndpoint";
import { SingleAppHttpRequestSymbol, SingleAppHttpRequestOptionalSymbol } from "../../../src/http/AzureHttpRequest";
import { UserInfo } from "../../../src/http";
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

import "../../../src/functions/v3/syncIds";

describe("syncIds", () => {
    const MockBlob = Blob as jest.MockedClass<typeof Blob>;
    const mockAppCache = AppCache as jest.Mocked<typeof AppCache>;
    const mockLogAppEvent = loggingModule.logAppEvent as jest.MockedFunction<typeof loggingModule.logAppEvent>;

    let mockBlobInstance: {
        read: jest.Mock;
        exists: jest.Mock;
        optimisticUpdate: jest.Mock;
    };

    const createMockRequest = (appInfo: any = {}, overrides: any = {}) => {
        return {
            params: { appId: "test-app-id" },
            headers: {
                get: jest.fn().mockReturnValue(null),
            },
            body: {
                ids: {},
            },
            method: "POST",
            appId: "test-app-id",
            app: appInfo,
            appBlob: mockBlobInstance,
            user: undefined as UserInfo | undefined,
            markAsChanged: jest.fn(),
            ...overrides,
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
            expect(endpointConfig.moniker).toBe("v3-syncIds");
        });

        it("should create endpoint with correct route", () => {
            expect(endpointConfig.route).toBe("v3/syncIds/{appId}");
        });

        it("should create endpoint with undefined auth level", () => {
            expect(endpointConfig.authLevel).toBeUndefined();
        });

        it("should register POST and PATCH handlers", () => {
            expect(endpointConfig.POST).toBeDefined();
            expect(endpointConfig.PATCH).toBeDefined();
        });

        it("should mark handler as optional single app request", () => {
            expect(endpointConfig.POST[SingleAppHttpRequestOptionalSymbol]).toBe(true);
            expect(endpointConfig.POST[SingleAppHttpRequestSymbol]).toBeUndefined();
        });
    });

    // Note: Authorization validation is now handled centrally by bindApp.ts
    // See test/http/bindApp.test.ts for authorization tests;

    describe("POST handler - full replacement sync", () => {
        it("should use appBlob for operations", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                body: { ids: { codeunit: [1] } },
            });

            await endpointConfig.POST(request);

            expect(mockBlobInstance.optimisticUpdate).toHaveBeenCalled();
        });

        it("should replace all consumptions in POST", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    codeunit: [1, 2, 3],
                    table: [100, 200],
                });
            });
            const request = createMockRequest({}, {
                body: { ids: { codeunit: [5, 6, 7] } },
                method: "POST",
            });

            await endpointConfig.POST(request);

            const result = capturedUpdateFn!({
                codeunit: [1, 2, 3],
                table: [100, 200],
            });
            expect(result.codeunit).toEqual([5, 6, 7]);
            expect(result.table).toBeUndefined();
        });

        it("should preserve _authorization and _ranges during POST", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    _authorization: { key: "key" },
                    _ranges: [{ from: 1, to: 100 }],
                    codeunit: [1, 2, 3],
                });
            });
            const request = createMockRequest({}, {
                body: { ids: { table: [100] } },
                method: "POST",
            });

            await endpointConfig.POST(request);

            const existingApp = {
                _authorization: { key: "key" },
                _ranges: [{ from: 1, to: 100 }],
                codeunit: [1, 2, 3],
            };
            const result = capturedUpdateFn!(existingApp);
            expect(result._authorization).toEqual({ key: "key" });
            expect(result._ranges).toEqual([{ from: 1, to: 100 }]);
        });

    });

    describe("PATCH handler - merge sync", () => {
        it("should merge with existing consumptions in PATCH", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    codeunit: [1, 2, 3],
                });
            });
            const request = createMockRequest({}, {
                body: { ids: { codeunit: [4, 5] } },
                method: "PATCH",
            });

            await endpointConfig.PATCH(request);

            const existingApp = {
                codeunit: [1, 2, 3],
            };
            const result = capturedUpdateFn!(existingApp);
            expect(result.codeunit).toEqual([1, 2, 3, 4, 5]);
        });

        it("should deduplicate when merging in PATCH", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    codeunit: [1, 2, 3],
                });
            });
            const request = createMockRequest({}, {
                body: { ids: { codeunit: [2, 3, 4] } },
                method: "PATCH",
            });

            await endpointConfig.PATCH(request);

            const existingApp = {
                codeunit: [1, 2, 3],
            };
            const result = capturedUpdateFn!(existingApp);
            expect(result.codeunit).toEqual([1, 2, 3, 4]);
        });

        it("should preserve existing types not in request during PATCH", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    codeunit: [1, 2],
                    table: [100, 200],
                    page: [50],
                });
            });
            const request = createMockRequest({}, {
                body: { ids: { codeunit: [3] } },
                method: "PATCH",
            });

            await endpointConfig.PATCH(request);

            const existingApp = {
                codeunit: [1, 2],
                table: [100, 200],
                page: [50],
            };
            const result = capturedUpdateFn!(existingApp);
            expect(result.codeunit).toEqual([1, 2, 3]);
            expect(result.table).toEqual([100, 200]);
            expect(result.page).toEqual([50]);
        });

        it("should add new types during PATCH", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    codeunit: [1, 2],
                });
            });
            const request = createMockRequest({}, {
                body: { ids: { table: [100, 200] } },
                method: "PATCH",
            });

            await endpointConfig.PATCH(request);

            const existingApp = {
                codeunit: [1, 2],
            };
            const result = capturedUpdateFn!(existingApp);
            expect(result.codeunit).toEqual([1, 2]);
            expect(result.table).toEqual([100, 200]);
        });

        // Note: Authorization validation is now handled centrally by bindApp.ts
    });

    describe("cache interactions", () => {
        it("should update cache after POST sync", async () => {
            const updatedApp = { codeunit: [1, 2, 3] };
            mockBlobInstance.optimisticUpdate.mockResolvedValue(updatedApp);
            const request = createMockRequest({}, {
                body: { ids: { codeunit: [1, 2, 3] } },
            });

            await endpointConfig.POST(request);

            expect(mockAppCache.set).toHaveBeenCalledWith("test-app-id", updatedApp);
        });

        it("should update cache after PATCH sync", async () => {
            const updatedApp = { codeunit: [1, 2, 3, 4, 5] };
            mockBlobInstance.optimisticUpdate.mockResolvedValue(updatedApp);
            const request = createMockRequest({}, {
                body: { ids: { codeunit: [4, 5] } },
                method: "PATCH",
            });

            await endpointConfig.PATCH(request);

            expect(mockAppCache.set).toHaveBeenCalledWith("test-app-id", updatedApp);
        });
    });

    describe("extended type handling", () => {
        it("should handle extended type format in PATCH", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({
                    "table_50000": [1, 2],
                });
            });
            const request = createMockRequest({}, {
                body: {
                    ids: {
                        "table_50000": [3, 4],
                    },
                },
                method: "PATCH",
            });

            await endpointConfig.PATCH(request);

            const existingApp = {
                "table_50000": [1, 2],
            };
            const result = capturedUpdateFn!(existingApp);
            expect(result["table_50000"]).toEqual([1, 2, 3, 4]);
        });
    });

    describe("logging interactions", () => {
        it("should call logAppEvent with syncFull event and req.user for POST", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({});
            const request = createMockRequest({}, {
                body: { ids: {} },
                user: testUser,
            });

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith("test-app-id", "syncFull", testUser);
        });

        it("should call logAppEvent with syncMerge event and req.user for PATCH", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({});
            const request = createMockRequest({}, {
                body: { ids: {} },
                method: "PATCH",
                user: testUser,
            });

            await endpointConfig.PATCH(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith("test-app-id", "syncMerge", testUser);
        });

        it("should call logAppEvent with undefined user when req.user is undefined", async () => {
            mockBlobInstance.optimisticUpdate.mockResolvedValue({});
            const request = createMockRequest({}, {
                body: { ids: {} },
                user: undefined,
            });

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith("test-app-id", "syncFull", undefined);
        });
    });
});
