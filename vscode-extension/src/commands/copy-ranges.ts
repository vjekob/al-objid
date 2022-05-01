import { ALWorkspace } from "../lib/ALWorkspace";
import { LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { NinjaALRange } from "../lib/types";
import { UI } from "../lib/UI";

export async function copyRanges() {
    const manifest = await ALWorkspace.selectWorkspaceFolder();
    if (!manifest) {
        return;
    }

    const objIdConfig = ObjIdConfig.instance(manifest.ninja.uri);
    const existingRangesJson = JSON.stringify(objIdConfig.idRanges);
    const newRanges = manifest.idRanges.map(range => ({ ...range, description: `From ${range.from} to ${range.to}` }) as NinjaALRange);
    const newRangesJson = JSON.stringify(newRanges);

    if (newRangesJson === existingRangesJson) {
        return;
    }

    if (objIdConfig.idRanges.length > 0) {
        switch (await UI.copyRanges.rangesExistConfirmation(manifest)) {
            case LABELS.COPY_RANGES_ARE_YOU_SURE.YES:
                // Continue with defining ranges
                break;
            case LABELS.COPY_RANGES_ARE_YOU_SURE.NO:
                // Exit and do nothing
                return;
            case LABELS.COPY_RANGES_ARE_YOU_SURE.LEARN_MORE:
                // Show document and exit without doing anything
                showDocument("logical-ranges");
                return;
        }
    }

    ObjIdConfig.instance(manifest.ninja.uri).idRanges = manifest.idRanges.map(range => ({ ...range, description: `From ${range.from} to ${range.to}` }) as NinjaALRange);
}
