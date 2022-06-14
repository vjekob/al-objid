import { Blob, RequestHandler } from "@vjeko.com/azure-func";
import { TelemetryEntry, TelemetryLog, TelemetryRequest } from "./types";
import { randomBytes } from "crypto";

let pending: TelemetryEntry[] = [];

const instanceId = `${new Date().toISOString().split("T")[0]}-${randomBytes(8).toString("hex")}`;
let iterationId = 0;
let instanceCallNo = 0;
let timeout: NodeJS.Timeout;

async function flush() {
    const blob = new Blob<TelemetryLog>(`${instanceId}-${iterationId}.json`);
    await blob.optimisticUpdate((log: TelemetryLog) => {
        if (!log) {
            log = {
                startedAt: Date.now(),
                log: pending,
                length: 0,
                lastModifiedAt: Date.now(),
            };
        } else {
            log.log.push(...pending);
            log.length = log.log.length;
            log.lastModifiedAt = Date.now();
        }
        if (log.log.length > 1000) {
            iterationId++;
        }
        return { ...log };
    });
    pending = [];
}

async function scheduleFlush() {
    if (timeout) {
        clearTimeout(timeout);
    }

    if (pending.length > 10) {
        await flush();
        return;
    }

    timeout = setTimeout(flush, 30000);
}

const telemetry = new RequestHandler<TelemetryRequest>(async (request) => {
    const { ownEndpoints, userSha, appSha, event, context } = request.body;
    const timestamp = Date.now();
    ++instanceCallNo;

    pending.push({
        timestamp,
        instanceId,
        instanceCallNo,
        ownEndpoints,
        userSha,
        appSha,
        event,
        context,
    });

    scheduleFlush();
    return null;
});

export default telemetry.azureFunction;
