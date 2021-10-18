import { Blob, RequestHandler } from "@vjeko.com/azure-func";
import { TelemetryEntry, TelemetryRequest } from "./types";

let pending: TelemetryEntry[] = [];

const instanceId = ((length: number) => {
    const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return `${result}${Date.now()}`;
})(12);

let instanceCallNo = 0;
let lastFlushTimestamp = Date.now();

function addInstanceEvent(event: string) {
    pending.push({
        timestamp: Date.now(),
        instanceId,
        event,
    });
}

addInstanceEvent("start");

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

    if (pending.length === 1000 || timestamp - lastFlushTimestamp > 600000) {
        addInstanceEvent("flush");
        const blob = new Blob(`${instanceId}.json`);
        await blob.optimisticUpdate(() => pending);
        pending = [];
        lastFlushTimestamp = timestamp;
    }
    return null;
});

telemetry.validator.expect("body", {
    ownEndpoints: "boolean",
    userSha: "string",
    appSha: "string",
    event: "string",
});

export default telemetry.azureFunction;
