import { ALApp } from "../lib/ALApp";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

/**
 * Removes an invalid property from the root of the `.objidconfig` object
 */
export async function quickFixRemoveProperty(app: ALApp, type: string) {
    Telemetry.instance.logAppCommand(app, NinjaCommand.QuickFixRemoveProperty, { type });

    app.config.removeProperty(type);
}
