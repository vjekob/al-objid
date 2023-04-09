import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { ALApp } from "../lib/ALApp";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";
import { Range, TextDocument, Uri } from "vscode";
import { Backend } from "../lib/backend/Backend";
import { UI } from "../lib/UI";
import { LABELS } from "../lib/constants";

/**
 * Stores an ID assignment in the back end for a manually-assigned ID.
 */
export async function QuickFixStoreIdAssignment(app: ALApp, object: ALObject, document: TextDocument, range: Range) {
    Telemetry.instance.logAppCommand(app, NinjaCommand.QuickFixStoreIdAssignment, { type: object.type, id: object.id });

    if (!document || !range) {
        return;
    }

    const result = await Backend.addAssignment(app, object.type, object.id);
    if (!result) {
        if (await UI.assignment.showNotUpdatedError(object.type, object.id) === LABELS.BUTTON_LEARN_MORE) {
        }
    }
    // app.config.removeProperty(type);
}
