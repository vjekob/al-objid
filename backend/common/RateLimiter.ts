import { Context, HttpRequest } from "@azure/functions";
import { IPAddress } from "./types";
import { logRejection } from "./updates";

const CONSTRAINTS = {
    INTERVALS: {
        "1000": 10,
        "5000": 20,
        "10000": 40,
        "30000": 60,
    },

    // All requests are removed from history after this interval
    MAX_INTERVAL: 30000,

    // Number of maximum allowed violations
    MAX_VIOLATIONS: 3,
}

interface RateLimiterContext {
    ipAddress: string;
    endpoint: string;
    method: string;
    appId: string;
}

interface PropertyBag<T> {
    [key: string]: T;
}

const log: PropertyBag<number[]> = {};
const violations: PropertyBag<number[]> = {};
const nextRequestAt: PropertyBag<number> = {};

export class RateLimiter {
    private static getContext(req: HttpRequest): RateLimiterContext {
        const ipAddress = IPAddress.fromHeaders(req);
        const method = req.method;
        let url = req.url || (req as any).originalUrl || "";
        const parts = url.split("?")[0].split("/");
        const endpoint = parts[parts.length - 1];
        const appId = req.body?.appId || "";
        return { ipAddress, endpoint, method, appId };
    }

    public static accept(req: HttpRequest, context: Context): boolean {
        let { ipAddress, appId, endpoint } = this.getContext(req);
        const now = Date.now();

        if (nextRequestAt[ipAddress] && now < nextRequestAt[ipAddress]) return false;

        if (!log[ipAddress]) log[ipAddress] = [];
        if (!violations[ipAddress]) violations[ipAddress] = [];

        // Remove all entries older than MAX_INTERVAL
        log[ipAddress] = log[ipAddress].filter(timestamp => now - timestamp < CONSTRAINTS.MAX_INTERVAL);
        violations[ipAddress] = violations[ipAddress].filter(timestamp => now - timestamp < CONSTRAINTS.MAX_INTERVAL);

        const check = {};
        const intervals = Object.keys(CONSTRAINTS.INTERVALS);
        for (let interval of intervals) {
            check[interval] = 0;
        }
        for (let timestamp of log[ipAddress]) {
            for (let key of intervals) {
                let interval = parseInt(key);
                if (now - timestamp < interval) {
                    check[interval] = (check[interval] || 0) + 1;
                }
            }
        }

        let reject = false;
        for (let interval of intervals) {
            let count = check[interval];
            let max = CONSTRAINTS.INTERVALS[interval];
            if (count > max) {
                violations[ipAddress].push(now);
                reject = true;
                break;
            }
        }

        log[ipAddress].push(now);

        if (violations[ipAddress].length >= 3) {
            violations[ipAddress] = [];
            log[ipAddress] = [];
            nextRequestAt[ipAddress] = now + 15000;
            logRejection(appId, endpoint, ipAddress);
        }

        return !reject;
    }
};
