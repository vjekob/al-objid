import { LogLevel, output } from "../features/Output";
import { ALWorkspace } from "../lib/ALWorkspace";
import { ALRange, NinjaALRange } from "../lib/types";
import { UI } from "../lib/UI";

export async function consolidateRanges() {
    const manifest = await ALWorkspace.selectWorkspaceFolder();
    if (!manifest) {
        return;
    }

    const ranges = manifest.idRanges.sort((left, right) => left.from - right.from);
    const logicalRanges = manifest.ninja.config.idRanges.sort((left, right) => left.from - right.from);

    if (logicalRanges.length === 0) {
        UI.ranges.showNoLogicalRangesMessage(manifest);
        return;
    }

    const start = Date.now();

    const unused: number[] = [];
    for (let range of ranges) {
        for (let i = range.from; i <= range.to; i++) {
            let covered = false;
            for (let logical of logicalRanges) {
                if (i >= logical.from && i <= logical.to) {
                    covered = true;
                    break;
                }
            }
            if (!covered) {
                unused.push(i);
            }
        }
    }

    if (unused.length === 0) {
        UI.ranges.showRangeFullyRepresentedMessage(manifest);
        return;
    }

    const newRanges: NinjaALRange[] = [];
    let range = newRange(unused[0], newRanges.length + 1);
    for (let i = 1; i < unused.length; i++) {
        let id = unused[i];
        if (id === range.to + 1) {
            range.to = id
            continue;
        }

        newRanges.push(range);
        range = newRange(id, newRanges.length + 1);
    }
    newRanges.push(range);

    for (let range of newRanges) {
        logicalRanges.push(range);
    }
    manifest.ninja.config.idRanges = logicalRanges;

    output.log(`Completed in ${Date.now() - start} ms`, LogLevel.Info);

    UI.ranges.showRangesConsolidatedMessage(manifest, newRanges);
}

function newRange(from: number, ordinal: number): NinjaALRange {
    return { from, to: from, description: `Free range #${ordinal}` };
}
