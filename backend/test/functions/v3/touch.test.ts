import { createEndpoint } from "../../../src/http/createEndpoint";
import { ActivityLogger } from "../../../src/activity/ActivityLogger";
import { HttpStatusCode } from "../../../src/http/HttpStatusCode";

jest.mock("../../../src/http/createEndpoint");
jest.mock("../../../src/activity/ActivityLogger");

const mockCreateEndpoint = createEndpoint as jest.MockedFunction<typeof createEndpoint>;
const mockActivityLogger = ActivityLogger as jest.Mocked<typeof ActivityLogger>;

let endpointConfig: any;
mockCreateEndpoint.mockImplementation((config: any) => {
    endpointConfig = config;
});

import "../../../src/functions/v3/touch";

describe("touch", () => {
    const createMockRequest = (body: any, user: any = { email: "user@example.com" }) => ({
        params: {},
        headers: {
            get: jest.fn().mockReturnValue(null),
        },
        body,
        user,
        status: HttpStatusCode.Success_200_OK,
        setStatus: jest.fn(function(this: any, status: number) {
            this.status = status;
        }),
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockActivityLogger.logTouchActivity.mockResolvedValue(undefined);
    });

    describe("endpoint configuration", () => {
        it("should create endpoint with correct moniker", () => {
            expect(endpointConfig.moniker).toBe("v3-touch");
        });

        it("should create endpoint with correct route", () => {
            expect(endpointConfig.route).toBe("v3/touch");
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

    describe("POST handler - valid requests", () => {
        it("should call logTouchActivity with valid request", async () => {
            const request = createMockRequest({
                apps: ["app-1", "app-2", "app-3"],
                feature: "explorer",
            });

            const result = await endpointConfig.POST(request);

            expect(mockActivityLogger.logTouchActivity).toHaveBeenCalledWith(
                ["app-1", "app-2", "app-3"],
                "user@example.com",
                "explorer"
            );
            expect(request.setStatus).toHaveBeenCalledWith(HttpStatusCode.Success_204_NoContent);
            expect(result).toBeUndefined();
        });

        it("should return 204 No Content on success", async () => {
            const request = createMockRequest({
                apps: ["app-1"],
                feature: "explorer",
            });

            await endpointConfig.POST(request);

            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
        });

        it("should handle single app", async () => {
            const request = createMockRequest({
                apps: ["app-1"],
                feature: "getNext",
            });

            await endpointConfig.POST(request);

            expect(mockActivityLogger.logTouchActivity).toHaveBeenCalledWith(
                ["app-1"],
                "user@example.com",
                "getNext"
            );
        });
    });

    describe("POST handler - graceful validation", () => {
        it("should return 204 when apps array is empty", async () => {
            const request = createMockRequest({
                apps: [],
                feature: "explorer",
            });

            const result = await endpointConfig.POST(request);

            expect(mockActivityLogger.logTouchActivity).not.toHaveBeenCalled();
            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
            expect(result).toBeUndefined();
        });

        it("should return 204 when apps is missing", async () => {
            const request = createMockRequest({
                feature: "explorer",
            });

            const result = await endpointConfig.POST(request);

            expect(mockActivityLogger.logTouchActivity).not.toHaveBeenCalled();
            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
            expect(result).toBeUndefined();
        });

        it("should return 204 when apps is not an array", async () => {
            const request = createMockRequest({
                apps: "not-an-array",
                feature: "explorer",
            });

            const result = await endpointConfig.POST(request);

            expect(mockActivityLogger.logTouchActivity).not.toHaveBeenCalled();
            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
            expect(result).toBeUndefined();
        });

        it("should return 204 when feature is missing", async () => {
            const request = createMockRequest({
                apps: ["app-1"],
            });

            const result = await endpointConfig.POST(request);

            expect(mockActivityLogger.logTouchActivity).not.toHaveBeenCalled();
            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
            expect(result).toBeUndefined();
        });

        it("should return 204 when feature is not a string", async () => {
            const request = createMockRequest({
                apps: ["app-1"],
                feature: 123,
            });

            const result = await endpointConfig.POST(request);

            expect(mockActivityLogger.logTouchActivity).not.toHaveBeenCalled();
            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
            expect(result).toBeUndefined();
        });

        it("should return 204 when email is missing", async () => {
            const request = createMockRequest(
                {
                    apps: ["app-1"],
                    feature: "explorer",
                },
                { email: "" } // Empty email
            );

            const result = await endpointConfig.POST(request);

            expect(mockActivityLogger.logTouchActivity).not.toHaveBeenCalled();
            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
            expect(result).toBeUndefined();
        });

        it("should return 204 when user is missing", async () => {
            const request = createMockRequest(
                {
                    apps: ["app-1"],
                    feature: "explorer",
                },
                null // No user
            );

            const result = await endpointConfig.POST(request);

            expect(mockActivityLogger.logTouchActivity).not.toHaveBeenCalled();
            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
            expect(result).toBeUndefined();
        });
    });

    describe("POST handler - error handling", () => {
        it("should gracefully handle logging failures", async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            mockActivityLogger.logTouchActivity.mockRejectedValue(new Error("Blob write failed"));

            const request = createMockRequest({
                apps: ["app-1"],
                feature: "explorer",
            });

            // Should not throw
            const result = await endpointConfig.POST(request);

            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
            expect(result).toBeUndefined();
            expect(consoleErrorSpy).toHaveBeenCalledWith("Touch activity logging failed:", expect.any(Error));
            
            consoleErrorSpy.mockRestore();
        });

        it("should still return 204 even when logging fails", async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            mockActivityLogger.logTouchActivity.mockRejectedValue(new Error("Network error"));

            const request = createMockRequest({
                apps: ["app-1", "app-2"],
                feature: "explorer",
            });

            await endpointConfig.POST(request);

            expect(request.status).toBe(HttpStatusCode.Success_204_NoContent);
            expect(consoleErrorSpy).toHaveBeenCalledWith("Touch activity logging failed:", expect.any(Error));
            
            consoleErrorSpy.mockRestore();
        });
    });
});
