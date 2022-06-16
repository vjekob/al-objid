import { ALApp } from "../lib/ALApp";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

/**
 * Removes an invalid object type declaration in `objectRanges` property
 */
export async function quickFixRemoveDeclaration(app: ALApp, type: string) {
    Telemetry.instance.logAppCommand(app, NinjaCommand.QuickFixRemoveDeclaration, { type });

    app.config.setObjectTypeRanges(type, undefined);
}
