import { Telemetry } from "../lib/Telemetry";
import { UI } from "../lib/UI";
import { Backend } from "../lib/backend/Backend";
import { NinjaCommand } from "./commands";
import { AssignmentIdContext } from "./contexts/AssignmentContext";

export default async function confirmReclaimObjectId(context: AssignmentIdContext) {
    const { app, objectType, objectId } = context;
    Telemetry.instance.logAppCommand(app, NinjaCommand.ReclaimObjectId, { objectType, objectId });

    const response = await Backend.removeAssignment(app, objectType, objectId);
    if (response) {
        UI.assignment.reclaimSucceeded(objectType, objectId);
    } else {
        UI.assignment.reclaimFailed(objectType, objectId);
    }
}
