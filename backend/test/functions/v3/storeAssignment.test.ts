import { Blob } from "@vjeko.com/azure-blob";
import { createEndpoint } from "../../../src/http/createEndpoint";
import { SingleAppHttpRequestSymbol, SingleAppHttpRequestOptionalSymbol } from "../../../src/http/AzureHttpRequest";
import { UserInfo } from "../../../src/http";
import { AppCache } from "../../../src/cache";
import * as loggingModule from "../../../src/utils/logging";
import { ActivityLogger } from "../../../src/activity";

jest.mock("@vjeko.com/azure-blob");
jest.mock("../../../src/http/createEndpoint");
jest.mock("../../../src/cache");
jest.mock("../../../src/utils/logging");
jest.mock("../../../src/activity");

const mockCreateEndpoint = createEndpoint as jest.MockedFunction<typeof createEndpoint>;

const capturedConfigs: any[] = [];
mockCreateEndpoint.mockImplementation((config: any) => {
    capturedConfigs.push(config);
});

import "../../../src/functions/v3/storeAssignment";

describe("storeAssignment", () => {
    const MockBlob = Blob as jest.MockedClass<typeof Blob>;
    const mockAppCache = AppCache as jest.Mocked<typeof AppCache>;
    const mockLogAppEvent = loggingModule.logAppEvent as jest.MockedFunction<typeof loggingModule.logAppEvent>;
    const mockActivityLogger = ActivityLogger as jest.Mocked<typeof ActivityLogger>;

    // Get both endpoint configs (storeAssignment and storeAssignmentDelete)
    const storeAssignmentConfig = capturedConfigs.find(c => c.moniker === "v3-storeAssignment");
    const storeAssignmentDeleteConfig = capturedConfigs.find(c => c.moniker === "v3-storeAssignment-delete");

    let mockBlobInstance: {
        read: jest.Mock;
        exists: jest.Mock;
        optimisticUpdate: jest.Mock;
    };

    const createMockRequest = (appInfo: any = {}, overrides: any = {}) => {
        return {
            params: { appId: "test-app-id", type: "codeunit", id: "50000" },
            headers: {
                get: jest.fn().mockReturnValue(null),
            },
            body: {},
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
        mockActivityLogger.logActivity.mockResolvedValue(undefined);
    });

    describe("storeAssignment endpoint configuration", () => {
        it("should create endpoint with correct moniker", () => {
            expect(storeAssignmentConfig.moniker).toBe("v3-storeAssignment");
        });

        it("should create endpoint with correct route", () => {
            expect(storeAssignmentConfig.route).toBe("v3/storeAssignment/{appId}/{type}/{id}");
        });

        it("should create endpoint with undefined auth level", () => {
            expect(storeAssignmentConfig.authLevel).toBeUndefined();
        });

        it("should register only POST handler", () => {
            expect(storeAssignmentConfig.POST).toBeDefined();
            expect(storeAssignmentConfig.DELETE).toBeUndefined();
        });

        it("should mark POST handler as optional single app request", () => {
            expect(storeAssignmentConfig.POST[SingleAppHttpRequestOptionalSymbol]).toBe(true);
            expect(storeAssignmentConfig.POST[SingleAppHttpRequestSymbol]).toBeUndefined();
        });
    });

    describe("storeAssignmentDelete endpoint configuration", () => {
        it("should create delete endpoint with correct moniker", () => {
            expect(storeAssignmentDeleteConfig.moniker).toBe("v3-storeAssignment-delete");
        });

        it("should create delete endpoint with correct route", () => {
            expect(storeAssignmentDeleteConfig.route).toBe("v3/storeAssignment/{appId}/{type}/{id}/delete");
        });

        it("should create delete endpoint with undefined auth level", () => {
            expect(storeAssignmentDeleteConfig.authLevel).toBeUndefined();
        });

        it("should register only POST handler for delete endpoint", () => {
            expect(storeAssignmentDeleteConfig.POST).toBeDefined();
        });

        it("should mark POST handler as optional single app request", () => {
            expect(storeAssignmentDeleteConfig.POST[SingleAppHttpRequestOptionalSymbol]).toBe(true);
            expect(storeAssignmentDeleteConfig.POST[SingleAppHttpRequestSymbol]).toBeUndefined();
        });
    });

    describe("POST handler - add assignment", () => {
        it("should use appBlob for optimisticUpdate", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({});

            await storeAssignmentConfig.POST(request);

            expect(mockBlobInstance.optimisticUpdate).toHaveBeenCalled();
        });

        it("should parse id from params as number", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn(null);
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "codeunit", id: "12345" },
            });

            await storeAssignmentConfig.POST(request);

            const result = capturedUpdateFn!(null);
            expect(result.codeunit).toContain(12345);
        });

        it("should add ID to new consumption array when type does not exist", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({});
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "codeunit", id: "50000" },
            });

            await storeAssignmentConfig.POST(request);

            const result = capturedUpdateFn!({});
            expect(result.codeunit).toEqual([50000]);
        });

        it("should add ID to existing consumption array", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({ codeunit: [50000, 50002] });
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "codeunit", id: "50001" },
            });

            await storeAssignmentConfig.POST(request);

            const result = capturedUpdateFn!({ codeunit: [50000, 50002] });
            expect(result.codeunit).toContain(50001);
        });

        it("should sort consumption array after adding ID", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({ codeunit: [50000, 50003] });
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "codeunit", id: "50001" },
            });

            await storeAssignmentConfig.POST(request);

            const result = capturedUpdateFn!({ codeunit: [50000, 50003] });
            expect(result.codeunit).toEqual([50000, 50001, 50003]);
        });

        it("should return updated true when ID is added successfully", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({});

            const result = await storeAssignmentConfig.POST(request);

            expect(result).toEqual({ updated: true });
        });

        it("should return updated false when ID already exists", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                return fn({ codeunit: [50000] });
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "codeunit", id: "50000" },
            });

            const result = await storeAssignmentConfig.POST(request);

            expect(result).toEqual({ updated: false });
        });

        it("should create app when it does not exist", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn(null);
            });
            const request = createMockRequest({});

            await storeAssignmentConfig.POST(request);

            const result = capturedUpdateFn!(null);
            expect(result.codeunit).toEqual([50000]);
        });

        it("should handle different object types", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn(null);
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "table", id: "100" },
            });

            await storeAssignmentConfig.POST(request);

            const result = capturedUpdateFn!(null);
            expect(result.table).toEqual([100]);
        });

        it("should handle extended type format", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn(null);
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "table_50000", id: "5" },
            });

            await storeAssignmentConfig.POST(request);

            const result = capturedUpdateFn!(null);
            expect(result["table_50000"]).toEqual([5]);
        });
    });

    describe("cache interactions - add assignment", () => {
        it("should update cache after successfully adding assignment", async () => {
            const updatedApp = { codeunit: [50000] };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                return fn(null);
            });
            const request = createMockRequest({});

            await storeAssignmentConfig.POST(request);

            expect(mockAppCache.set).toHaveBeenCalledWith("test-app-id", expect.any(Object));
        });

        it("should not update cache when ID already exists", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                return fn({ codeunit: [50000] });
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
            });

            await storeAssignmentConfig.POST(request);

            expect(mockAppCache.set).not.toHaveBeenCalled();
        });
    });

    describe("POST /delete handler - remove assignment", () => {
        it("should use appBlob for optimisticUpdate", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn({ codeunit: [50000] }));
            const request = createMockRequest({});

            await storeAssignmentDeleteConfig.POST(request);

            expect(mockBlobInstance.optimisticUpdate).toHaveBeenCalled();
        });

        it("should remove ID from consumption array", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({ codeunit: [50000, 50001, 50002] });
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "codeunit", id: "50001" },
            });

            await storeAssignmentDeleteConfig.POST(request);

            const result = capturedUpdateFn!({ codeunit: [50000, 50001, 50002] });
            expect(result.codeunit).toEqual([50000, 50002]);
        });

        it("should return updated true when ID is removed", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn({ codeunit: [50000] }));
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "codeunit", id: "50000" },
            });

            const result = await storeAssignmentDeleteConfig.POST(request);

            expect(result).toEqual({ updated: true });
        });

        it("should handle removing from non-existent app", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn(null);
            });
            const request = createMockRequest({});

            await storeAssignmentDeleteConfig.POST(request);

            const result = capturedUpdateFn!(null);
            expect(result).toEqual({});
        });

        it("should handle extended type format in delete", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn({ "table_50000": [5, 10, 15] });
            });
            const request = createMockRequest({}, {
                params: { appId: "test-app", type: "table_50000", id: "10" },
            });

            await storeAssignmentDeleteConfig.POST(request);

            const result = capturedUpdateFn!({ "table_50000": [5, 10, 15] });
            expect(result["table_50000"]).toEqual([5, 15]);
        });
    });

    describe("cache interactions - remove assignment", () => {
        it("should update cache after successfully removing assignment", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn({ codeunit: [50000] }));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
            });

            await storeAssignmentDeleteConfig.POST(request);

            expect(mockAppCache.set).toHaveBeenCalledWith("test-app-id", expect.any(Object));
        });
    });

    describe("logging interactions - add assignment", () => {
        it("should call logAppEvent with addAssignment event and req.user after successful add", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                user: testUser,
            });

            await storeAssignmentConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith(
                "test-app-id",
                "addAssignment",
                testUser,
                { type: "codeunit", id: 50000 }
            );
        });

        it("should call logAppEvent with undefined user when req.user is undefined", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                user: undefined,
            });

            await storeAssignmentConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith(
                "test-app-id",
                "addAssignment",
                undefined,
                { type: "codeunit", id: 50000 }
            );
        });
    });

    describe("logging interactions - remove assignment", () => {
        it("should call logAppEvent with removeAssignment event and req.user after successful remove", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn({ codeunit: [50000] }));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                user: testUser,
            });

            await storeAssignmentDeleteConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith(
                "test-app-id",
                "removeAssignment",
                testUser,
                { type: "codeunit", id: 50000 }
            );
        });

        it("should call logAppEvent with undefined user when req.user is undefined", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn({ codeunit: [50000] }));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                user: undefined,
            });

            await storeAssignmentDeleteConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith(
                "test-app-id",
                "removeAssignment",
                undefined,
                { type: "codeunit", id: 50000 }
            );
        });
    });

    describe("activity logging - add assignment", () => {
        it("should call ActivityLogger.logActivity with ninjaAppId, email, and addAssignment feature", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                user: testUser,
                headers: {
                    get: jest.fn().mockImplementation((name: string) =>
                        name === "Ninja-App-Id" ? "ninja-app-guid" : null
                    ),
                },
            });

            await storeAssignmentConfig.POST(request);

            expect(mockActivityLogger.logActivity).toHaveBeenCalledWith(
                "ninja-app-guid",
                "test@example.com",
                "addAssignment"
            );
        });

        it("should use empty string for email when user is undefined", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                user: undefined,
                headers: {
                    get: jest.fn().mockImplementation((name: string) =>
                        name === "Ninja-App-Id" ? "ninja-app-guid" : null
                    ),
                },
            });

            await storeAssignmentConfig.POST(request);

            expect(mockActivityLogger.logActivity).toHaveBeenCalledWith(
                "ninja-app-guid",
                "",
                "addAssignment"
            );
        });

        it("should not call ActivityLogger.logActivity when Ninja-App-Id header is missing", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                headers: {
                    get: jest.fn().mockReturnValue(null),
                },
            });

            await storeAssignmentConfig.POST(request);

            expect(mockActivityLogger.logActivity).not.toHaveBeenCalled();
        });

        it("should handle ActivityLogger errors gracefully", async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            mockActivityLogger.logActivity.mockRejectedValue(new Error("Logging failed"));
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                headers: {
                    get: jest.fn().mockImplementation((name: string) =>
                        name === "Ninja-App-Id" ? "ninja-app-guid" : null
                    ),
                },
            });

            const result = await storeAssignmentConfig.POST(request);

            expect(result).toEqual({ updated: true });
            expect(consoleErrorSpy).toHaveBeenCalledWith("Activity logging failed:", expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });

    describe("activity logging - remove assignment", () => {
        it("should call ActivityLogger.logActivity with ninjaAppId, email, and removeAssignment feature", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn({ codeunit: [50000] }));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                user: testUser,
                headers: {
                    get: jest.fn().mockImplementation((name: string) =>
                        name === "Ninja-App-Id" ? "ninja-app-guid" : null
                    ),
                },
            });

            await storeAssignmentDeleteConfig.POST(request);

            expect(mockActivityLogger.logActivity).toHaveBeenCalledWith(
                "ninja-app-guid",
                "test@example.com",
                "removeAssignment"
            );
        });

        it("should use empty string for email when user is undefined", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn({ codeunit: [50000] }));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                user: undefined,
                headers: {
                    get: jest.fn().mockImplementation((name: string) =>
                        name === "Ninja-App-Id" ? "ninja-app-guid" : null
                    ),
                },
            });

            await storeAssignmentDeleteConfig.POST(request);

            expect(mockActivityLogger.logActivity).toHaveBeenCalledWith(
                "ninja-app-guid",
                "",
                "removeAssignment"
            );
        });

        it("should not call ActivityLogger.logActivity when Ninja-App-Id header is missing", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn({ codeunit: [50000] }));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                headers: {
                    get: jest.fn().mockReturnValue(null),
                },
            });

            await storeAssignmentDeleteConfig.POST(request);

            expect(mockActivityLogger.logActivity).not.toHaveBeenCalled();
        });

        it("should handle ActivityLogger errors gracefully", async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            mockActivityLogger.logActivity.mockRejectedValue(new Error("Logging failed"));
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn({ codeunit: [50000] }));
            const request = createMockRequest({}, {
                params: { appId: "test-app-id", type: "codeunit", id: "50000" },
                headers: {
                    get: jest.fn().mockImplementation((name: string) =>
                        name === "Ninja-App-Id" ? "ninja-app-guid" : null
                    ),
                },
            });

            const result = await storeAssignmentDeleteConfig.POST(request);

            expect(result).toEqual({ updated: true });
            expect(consoleErrorSpy).toHaveBeenCalledWith("Activity logging failed:", expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });
});
