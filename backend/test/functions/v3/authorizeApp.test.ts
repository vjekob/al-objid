import { Blob } from "@vjeko.com/azure-blob";
import { ErrorResponse, HttpStatusCode, UserInfo } from "../../../src/http";
import * as hashModule from "../../../src/utils/hash";
import { createEndpoint } from "../../../src/http/createEndpoint";
import { SingleAppHttpRequestSymbol, SingleAppHttpRequestOptionalSymbol } from "../../../src/http/AzureHttpRequest";
import { AppCache } from "../../../src/cache";
import * as loggingModule from "../../../src/utils/logging";

jest.mock("@vjeko.com/azure-blob");
jest.mock("../../../src/utils/hash");
jest.mock("../../../src/http/createEndpoint");
jest.mock("../../../src/cache");
jest.mock("../../../src/utils/logging");

const mockCreateEndpoint = createEndpoint as jest.MockedFunction<typeof createEndpoint>;

// Capture the endpoint configuration
let endpointConfig: any;
mockCreateEndpoint.mockImplementation((config: any) => {
    endpointConfig = config;
});

// Import the module to trigger createEndpoint call
import "../../../src/functions/v3/authorizeApp";

describe("authorizeApp", () => {
    const MockBlob = Blob as jest.MockedClass<typeof Blob>;
    const mockGetSha256 = hashModule.getSha256 as jest.MockedFunction<typeof hashModule.getSha256>;
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
        mockGetSha256.mockReturnValue("generated-auth-key");
        mockLogAppEvent.mockResolvedValue(undefined);
    });

    describe("endpoint configuration", () => {
        it("should create endpoint with correct moniker", () => {
            expect(endpointConfig.moniker).toBe("v3-authorizeApp");
        });

        it("should create endpoint with correct route", () => {
            expect(endpointConfig.route).toBe("v3/authorizeApp/{appId}");
        });

        it("should create endpoint with undefined auth level", () => {
            expect(endpointConfig.authLevel).toBeUndefined();
        });

        it("should register GET, POST, and DELETE handlers", () => {
            expect(endpointConfig.GET).toBeDefined();
            expect(endpointConfig.POST).toBeDefined();
            expect(endpointConfig.DELETE).toBeDefined();
        });

        it("should mark GET and POST handlers as optional single app request", () => {
            expect(endpointConfig.GET[SingleAppHttpRequestOptionalSymbol]).toBe(true);
            expect(endpointConfig.POST[SingleAppHttpRequestOptionalSymbol]).toBe(true);
            expect(endpointConfig.GET[SingleAppHttpRequestSymbol]).toBeUndefined();
            expect(endpointConfig.POST[SingleAppHttpRequestSymbol]).toBeUndefined();
        });

        it("should mark DELETE handler as mandatory single app request", () => {
            expect(endpointConfig.DELETE[SingleAppHttpRequestSymbol]).toBe(true);
            expect(endpointConfig.DELETE[SingleAppHttpRequestOptionalSymbol]).toBeUndefined();
        });
    });

    describe("GET handler - check authorization status", () => {
        it("should use pre-bound app content (no read needed)", async () => {
            const appInfo = { codeunit: [1, 2, 3] };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.GET(request);

            expect(result.authorized).toBe(false);
        });

        it("should return authorized false when app has no authorization", async () => {
            const request = createMockRequest({});

            const result = await endpointConfig.GET(request);

            expect(result).toEqual({
                authorized: false,
                user: null,
            });
        });

        it("should return authorized false when app is empty", async () => {
            const request = createMockRequest(null);

            const result = await endpointConfig.GET(request);

            expect(result).toEqual({
                authorized: false,
                user: null,
            });
        });

        it("should return authorized true when app has authorization", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                    user: {
                        name: "John Doe",
                        email: "john@example.com",
                        timestamp: 1234567890,
                    },
                },
            };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.GET(request);

            expect(result.authorized).toBe(true);
            expect(result.user).toEqual({
                name: "John Doe",
                email: "john@example.com",
                timestamp: 1234567890,
            });
        });

        it("should return valid true when authKey header matches stored key", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("auth-key-123"),
                },
            });

            const result = await endpointConfig.GET(request);

            expect(result.valid).toBe(true);
        });

        it("should return valid false when authKey header does not match stored key", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("wrong-key"),
                },
            });

            const result = await endpointConfig.GET(request);

            expect(result.valid).toBe(false);
        });

        it("should not include valid field when app has no authorization key", async () => {
            const request = createMockRequest({});

            const result = await endpointConfig.GET(request);

            expect(result).not.toHaveProperty("valid");
        });

        it("should return user null when authorization exists but has no user", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.GET(request);

            expect(result.user).toBeNull();
        });
    });

    describe("POST handler - authorize an app", () => {
        it("should use appBlob for optimisticUpdate", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, { body: {} });

            await endpointConfig.POST(request);

            expect(mockBlobInstance.optimisticUpdate).toHaveBeenCalled();
        });

        it("should throw 405 when app is already authorized", async () => {
            const appInfo = {
                _authorization: {
                    key: "existing-key",
                },
            };
            const request = createMockRequest(appInfo, { body: {} });

            await expect(endpointConfig.POST(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.POST(request)).rejects.toMatchObject({
                message: expect.stringContaining("already authorized"),
                statusCode: HttpStatusCode.ClientError_405_MethodNotAllowed,
            });
        });

        it("should generate auth key using getSha256 with appId from request", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, { body: {}, appId: "test-app-id" });

            await endpointConfig.POST(request);

            expect(mockGetSha256).toHaveBeenCalledWith(
                expect.stringContaining("APP_AUTH_test-app-id_"),
                "base64"
            );
        });

        it("should call optimisticUpdate with authorization data", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => {
                const result = fn(null);
                return result;
            });
            const request = createMockRequest({}, { body: {} });

            await endpointConfig.POST(request);

            expect(mockBlobInstance.optimisticUpdate).toHaveBeenCalled();
            const updateFn = mockBlobInstance.optimisticUpdate.mock.calls[0][0];
            const result = updateFn(null);
            expect(result._authorization.key).toBe("generated-auth-key");
            expect(result._authorization.key).toBeDefined();
        });

        it("should include userName in authorization user data when provided via user binding", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                user: { name: "johndoe" },
            });

            await endpointConfig.POST(request);

            const updateFn = mockBlobInstance.optimisticUpdate.mock.calls[0][0];
            const result = updateFn(null);
            expect(result._authorization.user.name).toBe("johndoe");
        });

        it("should include userEmail in authorization user data when provided via user binding", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                user: { name: "johndoe", email: "john@example.com" },
            });

            await endpointConfig.POST(request);

            const updateFn = mockBlobInstance.optimisticUpdate.mock.calls[0][0];
            const result = updateFn(null);
            expect(result._authorization.user.name).toBe("johndoe");
            expect(result._authorization.user.email).toBe("john@example.com");
        });

        it("should include only userEmail when userName is not provided", async () => {
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(null));
            const request = createMockRequest({}, {
                user: { email: "john@example.com" },
            });

            await endpointConfig.POST(request);

            const updateFn = mockBlobInstance.optimisticUpdate.mock.calls[0][0];
            const result = updateFn(null);
            expect(result._authorization.user.email).toBe("john@example.com");
        });

        it("should return authKey in response", async () => {
            mockBlobInstance.optimisticUpdate.mockResolvedValue({
                _authorization: { key: "generated-auth-key" },
            });
            const request = createMockRequest({}, { body: {} });

            const result = await endpointConfig.POST(request);

            expect(result).toEqual({ authKey: "generated-auth-key" });
        });

        it("should allow authorization when existing app has no authorization key", async () => {
            const appInfo = {
                _authorization: {} as any,
            };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({
                _authorization: { key: "generated-auth-key" },
            });
            const request = createMockRequest(appInfo, { body: {} });

            const result = await endpointConfig.POST(request);

            expect(result).toEqual({ authKey: "generated-auth-key" });
        });

        it("should preserve existing app data during authorization", async () => {
            const existingApp = {
                codeunit: [1, 2, 3],
                table: [100, 200],
            };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(existingApp));
            const request = createMockRequest(existingApp, { body: {} });

            await endpointConfig.POST(request);

            const updateFn = mockBlobInstance.optimisticUpdate.mock.calls[0][0];
            const result = updateFn(existingApp);
            expect(result.codeunit).toEqual([1, 2, 3]);
            expect(result.table).toEqual([100, 200]);
        });
    });

    describe("DELETE handler - de-authorize an app", () => {
        it("should use appBlob for optimisticUpdate", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({});
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("auth-key-123"),
                },
            });

            await endpointConfig.DELETE(request);

            expect(mockBlobInstance.optimisticUpdate).toHaveBeenCalled();
        });

        it("should throw 405 when app is not authorized", async () => {
            const request = createMockRequest({});

            await expect(endpointConfig.DELETE(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.DELETE(request)).rejects.toMatchObject({
                message: expect.stringContaining("is not authorized"),
                statusCode: HttpStatusCode.ClientError_405_MethodNotAllowed,
            });
        });

        it("should throw 405 when app has no authorization key", async () => {
            const appInfo = {
                _authorization: {} as any,
            };
            const request = createMockRequest(appInfo);

            await expect(endpointConfig.DELETE(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.DELETE(request)).rejects.toMatchObject({
                message: expect.stringContaining("is not authorized"),
                statusCode: HttpStatusCode.ClientError_405_MethodNotAllowed,
            });
        });

        it("should throw 401 when authKey header does not match stored key", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("wrong-key"),
                },
            });

            await expect(endpointConfig.DELETE(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.DELETE(request)).rejects.toMatchObject({
                message: expect.stringContaining("incorrect authorization key"),
                statusCode: HttpStatusCode.ClientError_401_Unauthorized,
            });
        });

        it("should remove authorization from app when successful", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
                codeunit: [1, 2, 3],
            };
            mockBlobInstance.optimisticUpdate.mockImplementation((fn: Function) => fn(appInfo));
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("auth-key-123"),
                },
            });

            await endpointConfig.DELETE(request);

            const updateFn = mockBlobInstance.optimisticUpdate.mock.calls[0][0];
            const result = updateFn(appInfo);
            expect(result._authorization).toBeUndefined();
            expect(result.codeunit).toEqual([1, 2, 3]);
        });

        it("should return deleted true when de-authorization is successful", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({ codeunit: [1] });
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("auth-key-123"),
                },
            });

            const result = await endpointConfig.DELETE(request);

            expect(result).toEqual({ deleted: true });
        });

        it("should throw 500 when de-authorization fails (authorization still present)", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({
                _authorization: { key: "auth-key-123" },
            });
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("auth-key-123"),
                },
            });

            await expect(endpointConfig.DELETE(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.DELETE(request)).rejects.toMatchObject({
                message: expect.stringContaining("error occurred"),
                statusCode: HttpStatusCode.ServerError_500_InternalServerError,
            });
        });

        it("should throw 401 when authKey header is null", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue(null),
                },
            });

            await expect(endpointConfig.DELETE(request)).rejects.toThrow(ErrorResponse);
            await expect(endpointConfig.DELETE(request)).rejects.toMatchObject({
                statusCode: HttpStatusCode.ClientError_401_Unauthorized,
            });
        });
    });

    describe("cache interactions", () => {
        it("should update cache after successful POST authorization", async () => {
            const updatedApp = {
                _authorization: { key: "generated-auth-key" },
            };
            mockBlobInstance.optimisticUpdate.mockResolvedValue(updatedApp);
            const request = createMockRequest({}, { body: {} });

            await endpointConfig.POST(request);

            expect(mockAppCache.set).toHaveBeenCalledWith("test-app-id", updatedApp);
        });

        it("should not update cache when POST authorization fails (app already authorized)", async () => {
            const appInfo = {
                _authorization: {
                    key: "existing-key",
                },
            };
            const request = createMockRequest(appInfo, { body: {} });

            await expect(endpointConfig.POST(request)).rejects.toThrow();

            expect(mockAppCache.set).not.toHaveBeenCalled();
        });

        it("should update cache after successful DELETE de-authorization", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            const updatedApp = { codeunit: [1] };
            mockBlobInstance.optimisticUpdate.mockResolvedValue(updatedApp);
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("auth-key-123"),
                },
            });

            await endpointConfig.DELETE(request);

            expect(mockAppCache.set).toHaveBeenCalledWith("test-app-id", updatedApp);
        });

        it("should not update cache when DELETE fails (authorization still present)", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({
                _authorization: { key: "auth-key-123" },
            });
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("auth-key-123"),
                },
            });

            await expect(endpointConfig.DELETE(request)).rejects.toThrow();

            expect(mockAppCache.set).not.toHaveBeenCalled();
        });

        it("should not update cache for GET requests (read-only)", async () => {
            const appInfo = { codeunit: [1, 2, 3] };
            const request = createMockRequest(appInfo);

            await endpointConfig.GET(request);

            expect(mockAppCache.set).not.toHaveBeenCalled();
        });
    });

    describe("logging interactions", () => {
        it("should call logAppEvent with authorize event and req.user after successful POST", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({
                _authorization: { key: "generated-auth-key" },
            });
            const request = createMockRequest({}, { body: {}, user: testUser });

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith("test-app-id", "authorize", testUser);
        });

        it("should not call logAppEvent when POST fails (app already authorized)", async () => {
            const appInfo = {
                _authorization: {
                    key: "existing-key",
                },
            };
            const request = createMockRequest(appInfo, { body: {} });

            await expect(endpointConfig.POST(request)).rejects.toThrow();

            expect(mockLogAppEvent).not.toHaveBeenCalled();
        });

        it("should call logAppEvent with deauthorize event and req.user after successful DELETE", async () => {
            const testUser: UserInfo = { name: "Test User", email: "test@example.com" };
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({});
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("auth-key-123"),
                },
                user: testUser,
            });

            await endpointConfig.DELETE(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith("test-app-id", "deauthorize", testUser);
        });

        it("should not call logAppEvent when DELETE fails (authorization still present)", async () => {
            const appInfo = {
                _authorization: {
                    key: "auth-key-123",
                },
            };
            mockBlobInstance.optimisticUpdate.mockResolvedValue({
                _authorization: { key: "auth-key-123" },
            });
            const request = createMockRequest(appInfo, {
                headers: {
                    get: jest.fn().mockReturnValue("auth-key-123"),
                },
            });

            await expect(endpointConfig.DELETE(request)).rejects.toThrow();

            expect(mockLogAppEvent).not.toHaveBeenCalled();
        });

        it("should not call logAppEvent for GET requests", async () => {
            const appInfo = { codeunit: [1, 2, 3] };
            const request = createMockRequest(appInfo);

            await endpointConfig.GET(request);

            expect(mockLogAppEvent).not.toHaveBeenCalled();
        });

        it("should call logAppEvent with undefined user when req.user is undefined", async () => {
            mockBlobInstance.optimisticUpdate.mockResolvedValue({
                _authorization: { key: "generated-auth-key" },
            });
            const request = createMockRequest({}, { body: {}, user: undefined });

            await endpointConfig.POST(request);

            expect(mockLogAppEvent).toHaveBeenCalledWith("test-app-id", "authorize", undefined);
        });
    });
});
