import { ALWorkspace } from "../lib/ALWorkspace";
import { NinjaALRange } from "../lib/types";
import { UI } from "../lib/UI";

export async function consolidateRanges() {
    const manifest = await ALWorkspace.selectWorkspaceFolder();
    if (!manifest) {
        return;
    }

    // Create a sorted clone of app.json ranges and .objidconfig (logical) ranges
    let ranges = manifest.idRanges.sort((left, right) => left.from - right.from).map(range => ({ ...range }));
    let logicalRanges = manifest.ninja.config.idRanges.sort((left, right) => left.from - right.from).map(range => ({ ...range }));
    if (logicalRanges.length === 0) {
        UI.ranges.showNoLogicalRangesMessage(manifest);
        return;
    }

    const newRanges: NinjaALRange[] = [];
    const FREE_RANGE = "Free range";

    while (ranges.length) {
        // If there are no logical ranges left, add all remaining ranges and break the while loop
        if (logicalRanges.length === 0) {
            for (let range of ranges) {
                newRanges.push({ ...range, description: FREE_RANGE });
            }
            break;
        }

        switch (true) {
            case ranges[0].from === logicalRanges[0].from:
                switch (true) {
                    case ranges[0].to === logicalRanges[0].to:
                        newRanges.push(logicalRanges[0]);
                        ranges.shift();
                        logicalRanges.shift();
                        break;

                    case ranges[0].to < logicalRanges[0].to:
                        newRanges.push({ ...ranges[0], description: logicalRanges[0].description });
                        logicalRanges[0].from = ranges[0].to + 1;
                        ranges.shift();
                        break;

                    case ranges[0].to > logicalRanges[0].to:
                        newRanges.push(logicalRanges[0]);
                        ranges[0].from = logicalRanges[0].to + 1;
                        logicalRanges.shift();
                        break;
                }
                break;

            case ranges[0].from < logicalRanges[0].from:
                switch (true) {
                    case ranges[0].to < logicalRanges[0].from:
                        newRanges.push({ from: ranges[0].from, to: ranges[0].to, description: FREE_RANGE });
                        ranges.shift();
                        break;

                    default:
                        newRanges.push({ from: ranges[0].from, to: logicalRanges[0].from - 1, description: FREE_RANGE });
                        ranges[0].from = logicalRanges[0].from;
                        break;
                }
                break;

            case ranges[0].from > logicalRanges[0].from:
                switch (true) {
                    case logicalRanges[0].to < ranges[0].from:
                        logicalRanges.shift();
                        break;

                    default:
                        logicalRanges[0].from = ranges[0].from;
                        break;
                }
                break;
        }

        if (ranges.length && ranges[0].from > ranges[0].to) {
            ranges.shift();
        }

        if (logicalRanges.length && logicalRanges[0].from > logicalRanges[0].to) {
            logicalRanges.shift();
        }
    }

    // Combine adjacent ranges with same names
    const combinedRanges: NinjaALRange[] = [];
    while (newRanges.length) {
        const range = newRanges.shift()!;
        const combinedRange = combinedRanges[combinedRanges.length - 1];
        switch (true) {
            case combinedRanges.length === 0:
                combinedRanges.push(range);
                continue;

            case combinedRange.to === range.from - 1 && combinedRange.description === range.description:
                combinedRange.to = range.to;
                continue;

            default:
                combinedRanges.push(range);
                continue;
        }
    }

    // Sort resulting ranges according to original sort order
    const logicalNames = manifest.ninja.config.idRanges.reduce<string[]>((names, range) => (range.description && !names.includes(range.description) && names.push(range.description), names), []);
    const resultRanges: NinjaALRange[] = [];
    for (let name of logicalNames) {
        for (let i = 0; i < combinedRanges.length; i++) {
            if (combinedRanges[i].description === name) {
                resultRanges.push(combinedRanges.splice(i, 1)[0]);
                i--;
            }
        }
    }

    // Add remaining ranges 
    resultRanges.push(...combinedRanges);

    manifest.ninja.config.idRanges = resultRanges;
    UI.ranges.showRangesConsolidatedMessage(manifest);
}
