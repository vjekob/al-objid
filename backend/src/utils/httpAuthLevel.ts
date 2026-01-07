/**
 * Determines the HTTP authentication level based on the environment variable.
 * 
 * @returns {string} The authentication level: 'function' or 'anonymous'
 */
export function getHttpAuthLevel(): string {
    const value = process.env.USE_FUNCTION_ACCESS_KEYS;
    if (!value) {
        return "anonymous";
    }
    return value.toLowerCase() === "true" ? "function" : "anonymous";
}
