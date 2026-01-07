import { getHttpAuthLevel } from "../../src/utils/httpAuthLevel";

describe("getHttpAuthLevel", () => {
    const originalEnv = process.env.USE_FUNCTION_ACCESS_KEYS;

    afterEach(() => {
        // Restore original environment variable after each test
        if (originalEnv === undefined) {
            delete process.env.USE_FUNCTION_ACCESS_KEYS;
        } else {
            process.env.USE_FUNCTION_ACCESS_KEYS = originalEnv;
        }
    });

    describe("when USE_FUNCTION_ACCESS_KEYS is set to 'true'", () => {
        it("should return 'function' for lowercase 'true'", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "true";
            expect(getHttpAuthLevel()).toBe("function");
        });

        it("should return 'function' for uppercase 'TRUE'", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "TRUE";
            expect(getHttpAuthLevel()).toBe("function");
        });

        it("should return 'function' for mixed case 'True'", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "True";
            expect(getHttpAuthLevel()).toBe("function");
        });

        it("should return 'function' for mixed case 'TrUe'", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "TrUe";
            expect(getHttpAuthLevel()).toBe("function");
        });
    });

    describe("when USE_FUNCTION_ACCESS_KEYS is set to other values", () => {
        it("should return 'anonymous' for 'false'", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "false";
            expect(getHttpAuthLevel()).toBe("anonymous");
        });

        it("should return 'anonymous' for '1'", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "1";
            expect(getHttpAuthLevel()).toBe("anonymous");
        });

        it("should return 'anonymous' for 'yes'", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "yes";
            expect(getHttpAuthLevel()).toBe("anonymous");
        });

        it("should return 'anonymous' for empty string", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "";
            expect(getHttpAuthLevel()).toBe("anonymous");
        });

        it("should return 'anonymous' for 'true ' (with trailing space)", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "true ";
            expect(getHttpAuthLevel()).toBe("anonymous");
        });

        it("should return 'anonymous' for ' true' (with leading space)", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = " true";
            expect(getHttpAuthLevel()).toBe("anonymous");
        });
    });

    describe("when USE_FUNCTION_ACCESS_KEYS is not set", () => {
        it("should return 'anonymous' when environment variable is undefined", () => {
            delete process.env.USE_FUNCTION_ACCESS_KEYS;
            expect(getHttpAuthLevel()).toBe("anonymous");
        });
    });

    describe("edge cases", () => {
        it("should handle null-like values gracefully", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "null";
            expect(getHttpAuthLevel()).toBe("anonymous");
        });

        it("should handle numeric strings", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "0";
            expect(getHttpAuthLevel()).toBe("anonymous");
        });

        it("should handle special characters", () => {
            process.env.USE_FUNCTION_ACCESS_KEYS = "true!";
            expect(getHttpAuthLevel()).toBe("anonymous");
        });
    });
});
