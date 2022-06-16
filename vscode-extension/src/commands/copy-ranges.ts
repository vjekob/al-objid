import { DOCUMENTS, LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions/showDocument";
import { NinjaALRange } from "../lib/types/NinjaALRange";
import { UI } from "../lib/UI";
import { WorkspaceManager } from "../features/WorkspaceManager";
import { AppCommandContext } from "./contexts/AppCommandContext";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

export async function copyRanges(context: AppCommandContext) {
    const app = context?.app || (await WorkspaceManager.instance.selectWorkspaceFolder());
    if (!app) {
        return;
    }

    Telemetry.instance.logCommand(NinjaCommand.CopyRanges);

    const ranges = app.config.idRanges;
    const existingRangesJson = JSON.stringify(ranges);
    const newRanges = app.manifest.idRanges.map(
        range => ({ ...range, description: `From ${range.from} to ${range.to}` } as NinjaALRange)
    );
    const newRangesJson = JSON.stringify(newRanges);

    if (newRangesJson === existingRangesJson) {
        return;
    }

    if (ranges.length > 0) {
        switch (await UI.ranges.showLogicalRangesExistConfirmation(app)) {
            case LABELS.COPY_RANGES_ARE_YOU_SURE.YES:
                // Continue with defining ranges
                break;
            case LABELS.COPY_RANGES_ARE_YOU_SURE.NO:
                // Exit and do nothing
                return;
            case LABELS.COPY_RANGES_ARE_YOU_SURE.LEARN_MORE:
                // Show document and exit without doing anything
                showDocument(DOCUMENTS.LOGICAL_RANGES);
                return;
            default:
                return;
        }
    }

    app.config.idRanges = app.manifest.idRanges.map(
        range => ({ ...range, description: `From ${range.from} to ${range.to}` } as NinjaALRange)
    );
}
