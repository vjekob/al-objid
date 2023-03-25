import { env, Uri } from "vscode";
import { Telemetry, TelemetryEventType } from "../Telemetry";

export default function openExternal(url: string) {
    Telemetry.instance.log(TelemetryEventType.OpenExternal, undefined, { url });
    env.openExternal(Uri.parse(url));
}
