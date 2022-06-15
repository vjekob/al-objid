import { RequestHandler } from "@vjeko.com/azure-func";
import { TelemetryRequest } from "./types";
import { createHmac } from "crypto";
import { Https } from "./https";

const telemetry = new RequestHandler<TelemetryRequest>(async (request) => {
    const { userSha, appSha, event, context } = request.body;

    const payload = { userSha, appSha, event, context };

    const workspaceId = process.env["WorkspaceId"];
    const signatureKey = process.env["IngestionSignatureKey"]
    const contentLength = JSON.stringify(payload).length;
    const xMsDate = new Date().toUTCString();
    const stringToSign = `POST\n${contentLength}\napplication/json\nx-ms-date:${xMsDate}\n/api/logs`;
    const signature = createHmac("sha256", Buffer.from(signatureKey, "base64"))
        .update(stringToSign, "utf-8")
        .digest("base64");

    const https = new Https({
        headers: {
            Authorization: `SharedKey ${workspaceId}:${signature}`,
            ["content-type"]: "application/json",
            ["Log-Type"]: "events",
            ["x-ms-date"]: xMsDate
        },
        hostname: `${workspaceId}.ods.opinsights.azure.com`,
        path: "/api/logs?api-version=2016-04-01"
    });

    return await https.send("POST", payload);
});

export default telemetry.azureFunction;
