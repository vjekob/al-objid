import { Blob, RequestHandler } from "@vjeko.com/azure-func";
import { TelemetryEntry, TelemetryLog, TelemetryRequest } from "./types";
import { randomBytes } from "crypto";

let pending: TelemetryEntry[] = [];

const instanceId = `${new Date().toISOString().split("T")[0]}-${randomBytes(8).toString("hex")}`;
let iterationId = 0;
let instanceCallNo = 0;
let timeout: NodeJS.Timeout;

async function dump() {
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

function scheduleDump() {
    if (timeout) {
        clearTimeout(timeout);
    }

    timeout = setTimeout(dump, 60000);
}

/*
waldo rocks
*/

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

    if (pending.length >= 20) {
        dump();
    } else {
        scheduleDump();
    }

    return null;
});

export default telemetry.azureFunction;
