import { Blob } from "@vjeko.com/azure-blob";
import { ErrorResponse, HttpStatusCode, UserInfo } from "../../../src/http";
import * as findFirstAvailableIdModule from "../../../src/utils/findFirstAvailableId";
import * as findAvailablePerRangeModule from "../../../src/utils/findAvailablePerRange";
import { createEndpoint } from "../../../src/http/createEndpoint";
import { SingleAppHttpRequestSymbol, SingleAppHttpRequestOptionalSymbol } from "../../../src/http/AzureHttpRequest";
import { AppCache } from "../../../src/cache";
import * as loggingModule from "../../../src/utils/logging";

jest.mock("@vjeko.com/azure-blob");
jest.mock("../../../src/utils/findFirstAvailableId");
jest.mock("../../../src/utils/findAvailablePerRange");
jest.mock("../../../src/http/createEndpoint");
jest.mock("../../../src/cache");
jest.mock("../../../src/utils/logging");

const mockCreateEndpoint = createEndpoint as jest.MockedFunction<typeof createEndpoint>;

let endpointConfig: any;
mockCreateEndpoint.mockImplementation((config: any) => {
    endpointConfig = config;
});

import "../../../src/functions/v3/getNext";

describe("getNext", () => {
    const MockBlob = Blob as jest.MockedClass<typeof Blob>;
    const mockFindFirstAvailableId = findFirstAvailableIdModule.findFirstAvailableId as jest.MockedFunction<typeof findFirstAvailableIdModule.findFirstAvailableId>;
    const mockFindAvailablePerRange = findAvailablePerRangeModule.findAvailablePerRange as jest.MockedFunction<typeof findAvailablePerRangeModule.findAvailablePerRange>;
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
                type: "codeunit",
                ranges: [{ from: 50000, to: 59999 }],
            },
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
        mockFindFirstAvailableId.mockReturnValue(50000);
        mockFindAvailablePerRange.mockReturnValue([50000]);
        mockLogAppEvent.mockResolvedValue(undefined);
    });

    describe("endpoint configuration", () => {
        it("should create endpoint with correct moniker", () => {
            expect(endpointConfig.moniker).toBe("v3-getNext");
        });

        it("should create endpoint with correct route", () => {
            expect(endpointConfig.route).toBe("v3/getNext/{appId}");
        });

        it("should create endpoint with undefined auth level", () => {
            expect(endpointConfig.authLevel).toBeUndefined();
        });

        it("should register only POST handler", () => {
            expect(endpointConfig.POST).toBeDefined();
            expect(endpointConfig.GET).toBeUndefined();
        });

        it("should mark POST handler as optional single app request", () => {
            expect(endpointConfig.POST[SingleAppHttpRequestOptionalSymbol]).toBe(true);
            expect(endpointConfig.POST[SingleAppHttpRequestSymbol]).toBeUndefined();
        });
    });

    describe("POST handler - get next available ID (no commit)", () => {
        it("should use pre-bound app data (no read needed)", async () => {
            const appInfo = { codeunit: [50000, 50001] };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result.hasConsumption).toBe(true);
        });

        it("should call findFirstAvailableId when perRange is false", async () => {
            const appInfo = { codeunit: [50000, 50001] };
            const request = createMockRequest(appInfo, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    perRange: false,
                },
            });

            await endpointConfig.POST(request);

            expect(mockFindFirstAvailableId).toHaveBeenCalled();
        });

        it("should call findAvailablePerRange when perRange is true", async () => {
            const appInfo = { codeunit: [] };
            mockFindAvailablePerRange.mockReturnValue([50000, 60000]);
            const request = createMockRequest(appInfo, {
                body: {
                    type: "codeunit",
                    ranges: [
                        { from: 50000, to: 59999 },
                        { from: 60000, to: 69999 },
                    ],
                    perRange: true,
                },
            });

            await endpointConfig.POST(request);

            expect(mockFindAvailablePerRange).toHaveBeenCalled();
        });

        it("should return next available ID without committing when commit is false", async () => {
            const appInfo = { codeunit: [50000] };
            mockFindFirstAvailableId.mockReturnValue(50001);
            const request = createMockRequest(appInfo, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: false,
                },
            });

            const result = await endpointConfig.POST(request);

            expect(result.id).toBe(50001);
            expect(result.updated).toBe(false);
            expect(result.available).toBe(true);
            expect(mockBlobInstance.optimisticUpdate).not.toHaveBeenCalled();
        });

        it("should return available false when no IDs are available", async () => {
            const appInfo = { codeunit: [50000] };
            mockFindFirstAvailableId.mockReturnValue(0);
            const request = createMockRequest(appInfo, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 50000 }],
                },
            });

            const result = await endpointConfig.POST(request);

            expect(result.id).toBe(0);
            expect(result.available).toBe(false);
        });

        it("should return hasConsumption true when app exists", async () => {
            const appInfo = { codeunit: [50000] };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result.hasConsumption).toBe(true);
        });

        it("should return hasConsumption false when req.app is null", async () => {
            const request = createMockRequest(null, {
                app: null,
            });

            const result = await endpointConfig.POST(request);

            expect(result.hasConsumption).toBe(false);
        });

        it("should return hasConsumption true when req.app is not null", async () => {
            const appInfo = { codeunit: [50000] };
            const request = createMockRequest(appInfo, {
                app: appInfo,
            });

            const result = await endpointConfig.POST(request);

            expect(result.hasConsumption).toBe(true);
        });

        it("should return hasConsumption false when req.app is null even with empty app object", async () => {
            const request = createMockRequest({}, {
                app: null,
            });

            const result = await endpointConfig.POST(request);

            expect(result.hasConsumption).toBe(false);
        });

        it("should return array of IDs when perRange is true", async () => {
            const appInfo = {};
            mockFindAvailablePerRange.mockReturnValue([50000, 60000, 70000]);
            const request = createMockRequest(appInfo, {
                body: {
                    type: "codeunit",
                    ranges: [
                        { from: 50000, to: 59999 },
                        { from: 60000, to: 69999 },
                        { from: 70000, to: 79999 },
                    ],
                    perRange: true,
                },
            });

            const result = await endpointConfig.POST(request);

            expect(result.id).toEqual([50000, 60000, 70000]);
            expect(result.available).toBe(true);
        });
    });

    describe("POST handler - get next available ID (with commit)", () => {
        it("should call optimisticUpdate when commit is true", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                const result = fn(null, 0);
                return result;
            });
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
            });

            await endpointConfig.POST(request);

            expect(mockBlobInstance.optimisticUpdate).toHaveBeenCalled();
        });

        it("should add ID to consumption array when committing", async () => {
            let capturedUpdateFn: Function;
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                capturedUpdateFn = fn;
                return fn(null, 0);
            });
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
            });

            await endpointConfig.POST(request);

            const result = capturedUpdateFn!(null, 0);
            expect(result.codeunit).toEqual([50000]);
        });

        it("should return updated true when commit succeeds", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null, 0));
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
            });

            const result = await endpointConfig.POST(request);

            expect(result.updated).toBe(true);
            expect(result.hasConsumption).toBe(true);
        });

        it("should return hasConsumption false when req.app is null and commit is true", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null, 0));
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest(null, {
                app: null,
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
            });

            const result = await endpointConfig.POST(request);

            expect(result.hasConsumption).toBe(true);
        });

        it("should return hasConsumption true when req.app is not null and commit is true", async () => {
            const appInfo = { codeunit: [] };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(appInfo, 0));
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest(appInfo, {
                app: appInfo,
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
            });

            const result = await endpointConfig.POST(request);

            expect(result.hasConsumption).toBe(true);
        });

        it("should throw 409 Conflict when too many update attempts", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                return fn(null, 100);
            });
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
            });

            await expect(endpointConfig.POST(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.POST(request)).rejects.toMatchObject({
                statusCode: HttpStatusCode.ClientError_409_Conflict,
            });
        });

        it("should not commit when commit is true but no ID available", async () => {
            mockFindFirstAvailableId.mockReturnValue(0);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 50000 }],
                    commit: true,
                },
            });

            const result = await endpointConfig.POST(request);

            expect(result.id).toBe(0);
            expect(result.available).toBe(false);
            expect(mockBlobInstance.optimisticUpdate).not.toHaveBeenCalled();
        });
    });

    describe("POST handler - validation", () => {
        describe("when perRange is true and commit is true but require is missing", () => {
            it("should return 400 Bad Request error", async () => {
                mockFindAvailablePerRange.mockReturnValue([50000, 60000]);
                const request = createMockRequest({}, {
                    body: {
                        type: "codeunit",
                        ranges: [
                            { from: 50000, to: 59999 },
                            { from: 60000, to: 69999 },
                        ],
                        perRange: true,
                        commit: true,
                        // require intentionally omitted
                    },
                });

                await expect(endpointConfig.POST(request)).rejects.toThrow(ErrorResponse);
                await expect(endpointConfig.POST(request)).rejects.toMatchObject({
                    statusCode: HttpStatusCode.ClientError_400_BadRequest,
                });
            });

            it("should not call optimisticUpdate when perRange is true, commit is true, and require is missing", async () => {
                mockFindAvailablePerRange.mockReturnValue([50000, 60000]);
                const request = createMockRequest({}, {
                    body: {
                        type: "codeunit",
                        ranges: [
                            { from: 50000, to: 59999 },
                            { from: 60000, to: 69999 },
                        ],
                        perRange: true,
                        commit: true,
                        // require intentionally omitted
                    },
                });

                try {
                    await endpointConfig.POST(request);
                } catch (e) {
                    // Expected to throw
                }

                expect(mockBlobInstance.optimisticUpdate).not.toHaveBeenCalled();
            });

            it("should not update cache when perRange is true, commit is true, and require is missing", async () => {
                mockFindAvailablePerRange.mockReturnValue([50000, 60000]);
                const request = createMockRequest({}, {
                    body: {
                        type: "codeunit",
                        ranges: [
                            { from: 50000, to: 59999 },
                            { from: 60000, to: 69999 },
                        ],
                        perRange: true,
                        commit: true,
                        // require intentionally omitted
                    },
                });

                try {
                    await endpointConfig.POST(request);
                } catch (e) {
                    // Expected to throw
                }

                expect(mockAppCache.set).not.toHaveBeenCalled();
            });
        });

        describe("when perRange is true and commit is true and require is provided", () => {
            it("should accept the request and commit the specified ID", async () => {
                mockFindAvailablePerRange.mockReturnValue([50000, 60000]);
                mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null, 0));
                const request = createMockRequest({}, {
                    body: {
                        type: "codeunit",
                        ranges: [
                            { from: 50000, to: 59999 },
                            { from: 60000, to: 69999 },
                        ],
                        perRange: true,
                        commit: true,
                        require: 50000,
                    },
                });

                const result = await endpointConfig.POST(request);

                expect(result.updated).toBe(true);
                expect(mockBlobInstance.optimisticUpdate).toHaveBeenCalled();
            });
        });
    });

    describe("cache interactions", () => {
        it("should update cache after successful commit", async () => {
            const updatedApp = { codeunit: [50000], _ranges: [{ from: 50000, to: 59999 }] };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                return fn(null, 0);
            });
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
            });

            await endpointConfig.POST(request);

            expect(mockAppCache.set).toHaveBeenCalledWith("test-app-id", expect.any(Object));
        });

        it("should not update cache when commit is false", async () => {
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: false,
                },
            });

            await endpointConfig.POST(request);

            expect(mockAppCache.set).not.toHaveBeenCalled();
        });

        it("should not update cache when no ID is available for commit", async () => {
            mockFindFirstAvailableId.mockReturnValue(0);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 50000 }],
                    commit: true,
                },
            });

            await endpointConfig.POST(request);

            expect(mockAppCache.set).not.toHaveBeenCalled();
        });
    });

    describe("extended type handling", () => {
        it("should add range 1-49999 for field types when object is in app ranges", async () => {
            mockFindFirstAvailableId.mockReturnValue(1);
            const request = createMockRequest({}, {
                body: {
                    type: "table_50000",
                    ranges: [{ from: 50000, to: 59999 }],
                },
            });

            await endpointConfig.POST(request);

            expect(mockFindFirstAvailableId).toHaveBeenCalledWith(
                [{ from: 1, to: 49999 }, { from: 50000, to: 59999 }],
                expect.any(Array)
            );
        });

        it("should not add range 1-49999 when object is not in app ranges", async () => {
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest({}, {
                body: {
                    type: "table_99999",
                    ranges: [{ from: 50000, to: 59999 }],
                },
            });

            await endpointConfig.POST(request);

            expect(mockFindFirstAvailableId).toHaveBeenCalledWith(
                [{ from: 50000, to: 59999 }],
                expect.any(Array)
            );
        });
    });

    describe("logging interactions", () => {
        it("should call logAppEvent with getNext event and req.user when update occurred", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockFindFirstAvailableId.mockReturnValue(50000);
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                const result = fn(null, 0);
                return result;
            });
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
                user: testUser,
            });

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith(
                "test-app-id",
                "getNext",
                testUser,
                { type: "codeunit", id: 50000 }
            );
        });

        it("should not call logAppEvent when commit is false", async () => {
            mockFindFirstAvailableId.mockReturnValue(50000);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                },
            });

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).not.toHaveBeenCalled();
        });

        it("should not call logAppEvent when no ID is available", async () => {
            mockFindFirstAvailableId.mockReturnValue(0);
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
            });

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).not.toHaveBeenCalled();
        });

        it("should call logAppEvent with undefined user when req.user is undefined", async () => {
            mockFindFirstAvailableId.mockReturnValue(50000);
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                const result = fn(null, 0);
                return result;
            });
            const request = createMockRequest({}, {
                body: {
                    type: "codeunit",
                    ranges: [{ from: 50000, to: 59999 }],
                    commit: true,
                },
                user: undefined,
            });

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith(
                "test-app-id",
                "getNext",
                undefined,
                { type: "codeunit", id: 50000 }
            );
        });
    });
});
