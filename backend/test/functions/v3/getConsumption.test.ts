import { Blob } from "@vjeko.com/azure-blob";
import { createEndpoint } from "../../../src/http/createEndpoint";
import { SingleAppHttpRequestSymbol } from "../../../src/http/AzureHttpRequest";

jest.mock("@vjeko.com/azure-blob");
jest.mock("../../../src/http/createEndpoint");

const mockCreateEndpoint = createEndpoint as jest.MockedFunction<typeof createEndpoint>;

let endpointConfig: any;
mockCreateEndpoint.mockImplementation((config: any) => {
    endpointConfig = config;
});

import "../../../src/functions/v3/getConsumption";

describe("getConsumption", () => {
    const MockBlob = Blob as jest.MockedClass<typeof Blob>;

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
            expect(endpointConfig.moniker).toBe("v3-getConsumption");
        });

        it("should create endpoint with correct route", () => {
            expect(endpointConfig.route).toBe("v3/getConsumption/{appId}");
        });

        it("should create endpoint with undefined auth level", () => {
            expect(endpointConfig.authLevel).toBeUndefined();
        });

        it("should register only POST handler", () => {
            expect(endpointConfig.POST).toBeDefined();
            expect(endpointConfig.GET).toBeUndefined();
            expect(endpointConfig.PUT).toBeUndefined();
            expect(endpointConfig.PATCH).toBeUndefined();
            expect(endpointConfig.DELETE).toBeUndefined();
        });

        it("should mark POST handler as single app request", () => {
            expect(endpointConfig.POST[SingleAppHttpRequestSymbol]).toBe(true);
        });
    });

    describe("POST handler - get consumption data", () => {
        it("should use app content directly (pre-bound)", async () => {
            const appInfo = { codeunit: [1, 2, 3] };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result.codeunit).toEqual([1, 2, 3]);
        });

        it("should return consumption data without internal properties", async () => {
            const appInfo = {
                _authorization: { key: "secret" },
                _ranges: [{ from: 1, to: 100 }],
                codeunit: [1, 2, 3],
                table: [100, 200],
            };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result).not.toHaveProperty("_authorization");
            expect(result).not.toHaveProperty("_ranges");
            expect(result.codeunit).toEqual([1, 2, 3]);
            expect(result.table).toEqual([100, 200]);
        });

        it("should calculate _total as sum of all consumption arrays", async () => {
            const appInfo = {
                codeunit: [1, 2, 3],
                table: [100, 200],
                page: [50],
            };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result._total).toBe(6);
        });

        it("should return _total of 0 when app has no consumptions", async () => {
            const appInfo = {};
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result._total).toBe(0);
        });

        it("should count only valid ALObjectType consumptions in _total", async () => {
            const appInfo = {
                codeunit: [1, 2, 3],
                table: [100, 200],
                enum: [10, 20, 30, 40],
                page: [50, 51, 52],
            };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result._total).toBe(12);
        });

        it("should include all ALObjectType consumptions in response", async () => {
            const appInfo = {
                codeunit: [1],
                enum: [2],
                enumextension: [3],
                page: [4],
                pageextension: [5],
                permissionset: [6],
                permissionsetextension: [7],
                query: [8],
                report: [9],
                reportextension: [10],
                table: [11],
                tableextension: [12],
                xmlport: [13],
            };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result.codeunit).toEqual([1]);
            expect(result.enum).toEqual([2]);
            expect(result.enumextension).toEqual([3]);
            expect(result.page).toEqual([4]);
            expect(result.pageextension).toEqual([5]);
            expect(result.permissionset).toEqual([6]);
            expect(result.permissionsetextension).toEqual([7]);
            expect(result.query).toEqual([8]);
            expect(result.report).toEqual([9]);
            expect(result.reportextension).toEqual([10]);
            expect(result.table).toEqual([11]);
            expect(result.tableextension).toEqual([12]);
            expect(result.xmlport).toEqual([13]);
            expect(result._total).toBe(13);
        });

        it("should handle extended type consumptions", async () => {
            const appInfo: any = {
                codeunit: [1, 2],
                table_123: [10, 20, 30],
                enum_456: [5],
            };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result.codeunit).toEqual([1, 2]);
            expect(result.table_123).toEqual([10, 20, 30]);
            expect(result.enum_456).toEqual([5]);
        });

        it("should work with different app IDs", async () => {
            const appInfo = { codeunit: [1] };
            const request = createMockRequest(appInfo, {
                appId: "another-app-id",
            });

            const result = await endpointConfig.POST(request);

            expect(result.codeunit).toEqual([1]);
        });

        it("should handle app with only internal properties", async () => {
            const appInfo = {
                _authorization: { key: "secret" },
                _ranges: [{ from: 1, to: 100 }],
            };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result).not.toHaveProperty("_authorization");
            expect(result).not.toHaveProperty("_ranges");
            expect(result._total).toBe(0);
        });

        it("should handle empty arrays in consumption data", async () => {
            const appInfo = {
                codeunit: [],
                table: [100],
            };
            const request = createMockRequest(appInfo);

            const result = await endpointConfig.POST(request);

            expect(result.codeunit).toEqual([]);
            expect(result.table).toEqual([100]);
            expect(result._total).toBe(1);
        });
    });
});
