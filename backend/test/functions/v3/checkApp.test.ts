import { Blob } from "@vjeko.com/azure-blob";
import { createEndpoint } from "../../../src/http/createEndpoint";

jest.mock("@vjeko.com/azure-blob");
jest.mock("../../../src/http/createEndpoint");

const mockCreateEndpoint = createEndpoint as jest.MockedFunction<typeof createEndpoint>;

let endpointConfig: any;
mockCreateEndpoint.mockImplementation((config: any) => {
    endpointConfig = config;
});

import "../../../src/functions/v3/checkApp";

describe("checkApp", () => {
    const MockBlob = Blob as jest.MockedClass<typeof Blob>;

    let mockBlobInstance: {
        read: jest.Mock;
        exists: jest.Mock;
        optimisticUpdate: jest.Mock;
    };

    const createMockRequest = (overrides: any = {}) => {
        return {
            params: { appId: "test-app-id" },
            headers: {
                get: jest.fn().mockReturnValue(null),
            },
            body: {},
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
    });

    describe("endpoint configuration", () => {
        it("should create endpoint with correct moniker", () => {
            expect(endpointConfig.moniker).toBe("v3-checkApp");
        });

        it("should create endpoint with correct route", () => {
            expect(endpointConfig.route).toBe("v3/checkApp/{appId}");
        });

        it("should create endpoint with undefined auth level", () => {
            expect(endpointConfig.authLevel).toBeUndefined();
        });

        it("should register only GET handler", () => {
            expect(endpointConfig.GET).toBeDefined();
            expect(endpointConfig.POST).toBeUndefined();
            expect(endpointConfig.PUT).toBeUndefined();
            expect(endpointConfig.PATCH).toBeUndefined();
            expect(endpointConfig.DELETE).toBeUndefined();
        });

        it("should have handler function defined", () => {
            expect(typeof endpointConfig.GET).toBe("function");
        });
    });

    describe("GET handler - check app existence", () => {
        it("should return 'true' when app exists", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({ params: { appId: "test-app-id" } });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
            expect(MockBlob).toHaveBeenCalledWith("apps://test-app-id.json");
            expect(mockBlobInstance.read).toHaveBeenCalled();
        });

        it("should return 'false' when app does not exist", async () => {
            mockBlobInstance.read.mockResolvedValue(null);
            const request = createMockRequest({ params: { appId: "non-existent-app" } });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("false");
            expect(MockBlob).toHaveBeenCalledWith("apps://non-existent-app.json");
            expect(mockBlobInstance.read).toHaveBeenCalled();
        });

        it("should return 'false' when appId is missing", async () => {
            const request = createMockRequest({ params: {} });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("false");
        });

        it("should work with different app IDs", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({
                params: { appId: "custom-app-123" },
            });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
            expect(MockBlob).toHaveBeenCalledWith("apps://custom-app-123.json");
        });

        it("should work with UUID-style app IDs", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({
                params: { appId: "550e8400-e29b-41d4-a716-446655440000" },
            });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
            expect(MockBlob).toHaveBeenCalledWith("apps://550e8400-e29b-41d4-a716-446655440000.json");
        });

        it("should work with hyphenated app IDs", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({
                params: { appId: "my-custom-app-id" },
            });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
            expect(MockBlob).toHaveBeenCalledWith("apps://my-custom-app-id.json");
        });

        it("should work with numeric app IDs as strings", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({
                params: { appId: "12345" },
            });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
            expect(MockBlob).toHaveBeenCalledWith("apps://12345.json");
        });

        it("should work with app IDs containing underscores", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({
                params: { appId: "my_app_with_underscores" },
            });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
            expect(MockBlob).toHaveBeenCalledWith("apps://my_app_with_underscores.json");
        });

        it("should work with mixed case app IDs", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({
                params: { appId: "MyMixedCaseAppId" },
            });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
            expect(MockBlob).toHaveBeenCalledWith("apps://MyMixedCaseAppId.json");
        });

        it("should return 'true' when app exists with data", async () => {
            const appInfo = {
                codeunit: [1, 2, 3],
                table: [100, 200],
            };
            mockBlobInstance.read.mockResolvedValue(appInfo);
            const request = createMockRequest({ params: { appId: "test-app-id" } });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
        });

        it("should return 'false' when app is null", async () => {
            mockBlobInstance.read.mockResolvedValue(null);
            const request = createMockRequest({ params: { appId: "test-app-id" } });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("false");
        });

        it("should not modify the request object", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({ params: { appId: "test-app-id" } });
            const originalParams = { ...request.params };

            await endpointConfig.GET(request);

            expect(request.params).toEqual(originalParams);
        });

        it("should call blob read to check app existence", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({ params: { appId: "test-app-id" } });

            await endpointConfig.GET(request);

            expect(mockBlobInstance.read).toHaveBeenCalled();
            expect(mockBlobInstance.exists).not.toHaveBeenCalled();
            expect(mockBlobInstance.optimisticUpdate).not.toHaveBeenCalled();
        });

        it("should return lowercase string 'true' or 'false'", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({ params: { appId: "test-app-id" } });

            const result = await endpointConfig.GET(request);

            expect(typeof result).toBe("string");
            expect(result).toBe("true");
            expect(result).toBe(result.toLowerCase());
        });

        it("should complete successfully regardless of headers", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const requestWithAuthHeader = createMockRequest({
                params: { appId: "test-app-id" },
                headers: {
                    get: jest.fn().mockImplementation((name: string) => {
                        if (name === "authKey") return "some-auth-key";
                        if (name === "Content-Type") return "application/json";
                        return null;
                    }),
                },
            });

            const result = await endpointConfig.GET(requestWithAuthHeader);

            expect(result).toBe("true");
        });

        it("should complete successfully with empty body", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({ params: { appId: "test-app-id" }, body: {} });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
        });

        it("should complete successfully with populated body (ignored)", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({
                params: { appId: "test-app-id" },
                body: { someField: "value", anotherField: 123 },
            });

            const result = await endpointConfig.GET(request);

            expect(result).toBe("true");
        });
    });

    describe("handler behavior characteristics", () => {
        it("should be idempotent - multiple calls return same result", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({ params: { appId: "test-app-id" } });

            const result1 = await endpointConfig.GET(request);
            const result2 = await endpointConfig.GET(request);
            const result3 = await endpointConfig.GET(request);

            expect(result1).toBe("true");
            expect(result2).toBe("true");
            expect(result3).toBe("true");
        });

        it("should read blob to check app existence", async () => {
            mockBlobInstance.read.mockResolvedValue({});
            const request = createMockRequest({ params: { appId: "test-app-id" } });

            await endpointConfig.GET(request);

            // Verify blob read was called
            expect(mockBlobInstance.read).toHaveBeenCalled();
            expect(mockBlobInstance.exists).not.toHaveBeenCalled();
            expect(mockBlobInstance.optimisticUpdate).not.toHaveBeenCalled();
        });
    });

    describe("route parameter validation", () => {
        it("should have route parameter for appId in route pattern", () => {
            expect(endpointConfig.route).toContain("{appId}");
        });

        it("should use v3 API version prefix", () => {
            expect(endpointConfig.route).toMatch(/^v3\//);
        });

        it("should have checkApp as the endpoint name", () => {
            expect(endpointConfig.route).toContain("checkApp");
        });
    });
});
