import { commands } from "vscode";
import { Telemetry } from "../lib/Telemetry";
import { UI } from "../lib/UI";
import { Backend } from "../lib/backend/Backend";
import { LABELS, URLS } from "../lib/constants";
import openExternal from "../lib/functions/openExternal";
import { NinjaCommand } from "./commands";
import { AssignmentIdContext } from "./contexts/AssignmentContext";

export default async function confirmReclaimObjectId(context: AssignmentIdContext) {
    const { app, objectType, objectId } = context;
    Telemetry.instance.logAppCommand(app, NinjaCommand.ConfirmReclaimObjectId, { objectType, objectId });

    let answer = await UI.assignment.reclaimId(objectType, objectId);
    switch (answer) {
        case LABELS.NO:
            return;

        case LABELS.BUTTON_LEARN_MORE:
            openExternal(URLS.WIKI.RECLAIM_OBJECT_ID);
            return;
    }

    answer = await UI.assignment.reconfirmReclaimId(objectType, objectId);
    switch (answer) {
        case LABELS.NO:
            return;

        case LABELS.BUTTON_LEARN_MORE:
            openExternal(URLS.WIKI.RECLAIM_OBJECT_ID);
            return;
    }

    commands.executeCommand(NinjaCommand.ReclaimObjectId, context);
}
