import { createEndpoint } from "../../src/http/createEndpoint";
import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { AzureHttpHandler } from "../../src/http/AzureHttpHandler";
import * as handleRequestModule from "../../src/http/handleRequest";

jest.mock("@azure/functions", () => ({
    app: {
        http: jest.fn(),
    },
}));

jest.mock("../../src/http/handleRequest");

describe("createEndpoint", () => {
    const mockAppHttp = app.http as jest.MockedFunction<typeof app.http>;
    const mockHandleRequest = handleRequestModule.handleRequest as jest.MockedFunction<typeof handleRequestModule.handleRequest>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockHandleRequest.mockResolvedValue({ status: 200, body: "OK" });
    });

    describe("endpoint registration", () => {
        it("should call app.http with moniker and options", () => {
            const getHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                GET: getHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith("testEndpoint", expect.any(Object));
        });

        it("should set route in options", () => {
            const getHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "testEndpoint",
                route: "api/users/{id}",
                GET: getHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "testEndpoint",
                expect.objectContaining({
                    route: "api/users/{id}",
                })
            );
        });

        it("should set authLevel when provided", () => {
            const getHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "secureEndpoint",
                route: "api/secure",
                authLevel: "function",
                GET: getHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "secureEndpoint",
                expect.objectContaining({
                    authLevel: "function",
                })
            );
        });

        it("should support anonymous authLevel", () => {
            const getHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "anonEndpoint",
                route: "api/anon",
                authLevel: "anonymous",
                GET: getHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "anonEndpoint",
                expect.objectContaining({
                    authLevel: "anonymous",
                })
            );
        });

        it("should support admin authLevel", () => {
            const getHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "adminEndpoint",
                route: "api/admin",
                authLevel: "admin",
                GET: getHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "adminEndpoint",
                expect.objectContaining({
                    authLevel: "admin",
                })
            );
        });
    });

    describe("HTTP methods configuration", () => {
        it("should add GET to methods when GET handler is provided", () => {
            const getHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "getEndpoint",
                route: "api/resource",
                GET: getHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "getEndpoint",
                expect.objectContaining({
                    methods: ["GET"],
                })
            );
        });

        it("should add POST to methods when POST handler is provided", () => {
            const postHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "postEndpoint",
                route: "api/resource",
                POST: postHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "postEndpoint",
                expect.objectContaining({
                    methods: ["POST"],
                })
            );
        });

        it("should add PUT to methods when PUT handler is provided", () => {
            const putHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "putEndpoint",
                route: "api/resource",
                PUT: putHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "putEndpoint",
                expect.objectContaining({
                    methods: ["PUT"],
                })
            );
        });

        it("should add PATCH to methods when PATCH handler is provided", () => {
            const patchHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "patchEndpoint",
                route: "api/resource",
                PATCH: patchHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "patchEndpoint",
                expect.objectContaining({
                    methods: ["PATCH"],
                })
            );
        });

        it("should add DELETE to methods when DELETE handler is provided", () => {
            const deleteHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "deleteEndpoint",
                route: "api/resource",
                DELETE: deleteHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "deleteEndpoint",
                expect.objectContaining({
                    methods: ["DELETE"],
                })
            );
        });

        it("should add multiple methods in order when multiple handlers provided", () => {
            const getHandler: AzureHttpHandler = jest.fn();
            const postHandler: AzureHttpHandler = jest.fn();
            const putHandler: AzureHttpHandler = jest.fn();
            const patchHandler: AzureHttpHandler = jest.fn();
            const deleteHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "crudEndpoint",
                route: "api/resource",
                GET: getHandler,
                POST: postHandler,
                PUT: putHandler,
                PATCH: patchHandler,
                DELETE: deleteHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "crudEndpoint",
                expect.objectContaining({
                    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
                })
            );
        });

        it("should not include methods that are not provided", () => {
            const getHandler: AzureHttpHandler = jest.fn();
            const deleteHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "partialEndpoint",
                route: "api/resource",
                GET: getHandler,
                DELETE: deleteHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "partialEndpoint",
                expect.objectContaining({
                    methods: ["GET", "DELETE"],
                })
            );
        });

        it("should have empty methods array when no handlers provided", () => {
            createEndpoint({
                moniker: "emptyEndpoint",
                route: "api/empty",
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "emptyEndpoint",
                expect.objectContaining({
                    methods: [],
                })
            );
        });
    });

    describe("handler execution", () => {
        const createMockHttpRequest = (method: string): HttpRequest => ({
            method,
            headers: new Map() as any,
            query: new URLSearchParams(),
            params: {},
            url: "http://test.com",
            user: null,
            body: null,
            bodyUsed: false,
            arrayBuffer: jest.fn(),
            blob: jest.fn(),
            formData: jest.fn(),
            json: jest.fn(),
            text: jest.fn(),
        } as unknown as HttpRequest);

        const createMockContext = (): InvocationContext => ({} as InvocationContext);

        it("should call handleRequest with GET handler for GET requests", async () => {
            const getHandler: AzureHttpHandler = jest.fn();
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                GET: getHandler,
            });

            const registeredHandler = mockAppHttp.mock.calls[0][1].handler;
            const mockRequest = createMockHttpRequest("GET");
            const mockContext = createMockContext();

            await registeredHandler(mockRequest, mockContext);

            expect(mockHandleRequest).toHaveBeenCalledWith(getHandler, mockRequest);
        });

        it("should call handleRequest with POST handler for POST requests", async () => {
            const postHandler: AzureHttpHandler = jest.fn();
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                POST: postHandler,
            });

            const registeredHandler = mockAppHttp.mock.calls[0][1].handler;
            const mockRequest = createMockHttpRequest("POST");
            const mockContext = createMockContext();

            await registeredHandler(mockRequest, mockContext);

            expect(mockHandleRequest).toHaveBeenCalledWith(postHandler, mockRequest);
        });

        it("should call handleRequest with PUT handler for PUT requests", async () => {
            const putHandler: AzureHttpHandler = jest.fn();
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                PUT: putHandler,
            });

            const registeredHandler = mockAppHttp.mock.calls[0][1].handler;
            const mockRequest = createMockHttpRequest("PUT");
            const mockContext = createMockContext();

            await registeredHandler(mockRequest, mockContext);

            expect(mockHandleRequest).toHaveBeenCalledWith(putHandler, mockRequest);
        });

        it("should call handleRequest with PATCH handler for PATCH requests", async () => {
            const patchHandler: AzureHttpHandler = jest.fn();
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                PATCH: patchHandler,
            });

            const registeredHandler = mockAppHttp.mock.calls[0][1].handler;
            const mockRequest = createMockHttpRequest("PATCH");
            const mockContext = createMockContext();

            await registeredHandler(mockRequest, mockContext);

            expect(mockHandleRequest).toHaveBeenCalledWith(patchHandler, mockRequest);
        });

        it("should call handleRequest with DELETE handler for DELETE requests", async () => {
            const deleteHandler: AzureHttpHandler = jest.fn();
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                DELETE: deleteHandler,
            });

            const registeredHandler = mockAppHttp.mock.calls[0][1].handler;
            const mockRequest = createMockHttpRequest("DELETE");
            const mockContext = createMockContext();

            await registeredHandler(mockRequest, mockContext);

            expect(mockHandleRequest).toHaveBeenCalledWith(deleteHandler, mockRequest);
        });

        it("should return 405 Method Not Allowed when method handler is not defined", async () => {
            const getHandler: AzureHttpHandler = jest.fn();
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                GET: getHandler,
            });

            const registeredHandler = mockAppHttp.mock.calls[0][1].handler;
            const mockRequest = createMockHttpRequest("POST");
            const mockContext = createMockContext();

            const result = await registeredHandler(mockRequest, mockContext);

            expect(result).toEqual({ status: 405, body: "Method not allowed" });
            expect(mockHandleRequest).not.toHaveBeenCalled();
        });

        it("should return 405 for unsupported method even when other methods are defined", async () => {
            const getHandler: AzureHttpHandler = jest.fn();
            const postHandler: AzureHttpHandler = jest.fn();
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                GET: getHandler,
                POST: postHandler,
            });

            const registeredHandler = mockAppHttp.mock.calls[0][1].handler;
            const mockRequest = createMockHttpRequest("DELETE");
            const mockContext = createMockContext();

            const result = await registeredHandler(mockRequest, mockContext);

            expect(result).toEqual({ status: 405, body: "Method not allowed" });
        });

        it("should return the response from handleRequest", async () => {
            const expectedResponse = { status: 201, body: JSON.stringify({ id: 1 }) };
            mockHandleRequest.mockResolvedValue(expectedResponse);

            const postHandler: AzureHttpHandler = jest.fn();
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                POST: postHandler,
            });

            const registeredHandler = mockAppHttp.mock.calls[0][1].handler;
            const mockRequest = createMockHttpRequest("POST");
            const mockContext = createMockContext();

            const result = await registeredHandler(mockRequest, mockContext);

            expect(result).toBe(expectedResponse);
        });

        it("should handle async handleRequest correctly", async () => {
            const expectedResponse = { status: 200, body: "async result" };
            mockHandleRequest.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(expectedResponse), 10)));

            const getHandler: AzureHttpHandler = jest.fn();
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                GET: getHandler,
            });

            const registeredHandler = mockAppHttp.mock.calls[0][1].handler;
            const mockRequest = createMockHttpRequest("GET");
            const mockContext = createMockContext();

            const result = await registeredHandler(mockRequest, mockContext);

            expect(result).toBe(expectedResponse);
        });
    });

    describe("edge cases", () => {
        it("should handle undefined handler gracefully in method check", async () => {
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                GET: undefined as any,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "testEndpoint",
                expect.objectContaining({
                    methods: [],
                })
            );
        });

        it("should handle null handler gracefully in method check", async () => {
            createEndpoint({
                moniker: "testEndpoint",
                route: "api/test",
                GET: null as any,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "testEndpoint",
                expect.objectContaining({
                    methods: [],
                })
            );
        });

        it("should work with complex route patterns", () => {
            const getHandler: AzureHttpHandler = jest.fn();

            createEndpoint({
                moniker: "complexEndpoint",
                route: "api/users/{userId}/orders/{orderId}",
                GET: getHandler,
            });

            expect(mockAppHttp).toHaveBeenCalledWith(
                "complexEndpoint",
                expect.objectContaining({
                    route: "api/users/{userId}/orders/{orderId}",
                })
            );
        });
    });
});
