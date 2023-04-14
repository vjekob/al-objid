import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { ALApp } from "../lib/ALApp";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";
import { Range, TextDocument, Uri, commands } from "vscode";
import { Backend } from "../lib/backend/Backend";
import { UI } from "../lib/UI";
import { LABELS, URLS } from "../lib/constants";
import openExternal from "../lib/functions/openExternal";
import { AssignmentIdContext } from "./contexts/AssignmentContext";

/**
 * Stores an ID assignment in the back end for a manually-assigned ID.
 */
export async function QuickFixStoreIdAssignment(app: ALApp, object: ALObject, document: TextDocument, range: Range) {
    Telemetry.instance.logAppCommand(app, NinjaCommand.QuickFixStoreIdAssignment, { type: object.type, id: object.id });

    if (!document || !range) {
        return;
    }

    commands.executeCommand(NinjaCommand.StoreIdAssignment, {
        app,
        objectType: object.type,
        objectId: object.id,
    } as AssignmentIdContext);
}
