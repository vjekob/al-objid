import { ALWorkspace } from "../lib/ALWorkspace";
import { DOCUMENTS, LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions";
import { NinjaALRange } from "../lib/types";
import { UI } from "../lib/UI";

export async function copyRanges() {
    const manifest = await ALWorkspace.selectWorkspaceFolder();
    if (!manifest) {
        return;
    }

    const ranges = manifest.ninja.config.idRanges;
    const existingRangesJson = JSON.stringify(ranges);
    const newRanges = manifest.idRanges.map(
        range => ({ ...range, description: `From ${range.from} to ${range.to}` } as NinjaALRange)
    );
    const newRangesJson = JSON.stringify(newRanges);

    if (newRangesJson === existingRangesJson) {
        return;
    }

    if (ranges.length > 0) {
        switch (await UI.ranges.showLogicalRangesExistConfirmation(manifest)) {
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

    manifest.ninja.config.idRanges = manifest.idRanges.map(
        range => ({ ...range, description: `From ${range.from} to ${range.to}` } as NinjaALRange)
    );
}
