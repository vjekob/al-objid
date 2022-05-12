import { ALWorkspace } from "../lib/ALWorkspace";
import { ALRange, __AppManifest_obsolete_, NinjaALRange } from "../lib/types";
import { UI } from "../lib/UI";

export async function consolidateRanges() {
    const manifest = await ALWorkspace.selectWorkspaceFolder();
    if (!manifest) {
        return;
    }

    // Create a sorted clone of app.json ranges and .objidconfig (logical) ranges
    let ranges = manifest.idRanges
        .sort((left, right) => left.from - right.from)
        .map(range => ({ ...range }));

    // Consolidate logical ranges
    let consolidated = false;
    const logicalRanges = manifest.ninja.config.idRanges
        .sort((left, right) => left.from - right.from)
        .map(range => ({ ...range }));
    const consolidatedRanges = consolidate(manifest, ranges, logicalRanges);
    if (consolidatedRanges) {
        manifest.ninja.config.idRanges = consolidatedRanges;
        consolidated = true;
    }

    // Consolidate explicit object type logical ranges
    const explicitTypes = manifest.ninja.config.explicitObjectTypeRanges;
    for (let type of explicitTypes) {
        const logicalRanges = manifest.ninja.config
            .getObjectRanges(type)
            .sort((left, right) => left.from - right.from)
            .map(range => ({ ...range }));
        const consolidatedRanges = consolidate(manifest, ranges, logicalRanges);
        if (consolidatedRanges) {
            manifest.ninja.config.setObjectRanges(type, consolidatedRanges);
            consolidated = true;
        }
    }

    if (consolidated) {
        UI.ranges.showRangesConsolidatedMessage(manifest);
    }
}

function consolidate(
    manifest: __AppManifest_obsolete_,
    physicalRanges: ALRange[],
    logicalRanges: NinjaALRange[]
): NinjaALRange[] | undefined {
    // Creating a clone of physical ranges to eliminate side effects
    physicalRanges = [...physicalRanges.map(range => ({ ...range }))];

    if (logicalRanges.length === 0) {
        UI.ranges.showNoLogicalRangesMessage(manifest);
        return;
    }

    const newRanges: NinjaALRange[] = [];
    const FREE_RANGE = "Free range";

    while (physicalRanges.length) {
        // If there are no logical ranges left, add all remaining ranges and break the while loop
        if (logicalRanges.length === 0) {
            for (let range of physicalRanges) {
                newRanges.push({ ...range, description: FREE_RANGE });
            }
            break;
        }

        switch (true) {
            case physicalRanges[0].from === logicalRanges[0].from:
                switch (true) {
                    case physicalRanges[0].to === logicalRanges[0].to:
                        newRanges.push(logicalRanges[0]);
                        physicalRanges.shift();
                        logicalRanges.shift();
                        break;

                    case physicalRanges[0].to < logicalRanges[0].to:
                        newRanges.push({
                            ...physicalRanges[0],
                            description: logicalRanges[0].description,
                        });
                        logicalRanges[0].from = physicalRanges[0].to + 1;
                        physicalRanges.shift();
                        break;

                    case physicalRanges[0].to > logicalRanges[0].to:
                        newRanges.push(logicalRanges[0]);
                        physicalRanges[0].from = logicalRanges[0].to + 1;
                        logicalRanges.shift();
                        break;
                }
                break;

            case physicalRanges[0].from < logicalRanges[0].from:
                switch (true) {
                    case physicalRanges[0].to < logicalRanges[0].from:
                        newRanges.push({
                            from: physicalRanges[0].from,
                            to: physicalRanges[0].to,
                            description: FREE_RANGE,
                        });
                        physicalRanges.shift();
                        break;

                    default:
                        newRanges.push({
                            from: physicalRanges[0].from,
                            to: logicalRanges[0].from - 1,
                            description: FREE_RANGE,
                        });
                        physicalRanges[0].from = logicalRanges[0].from;
                        break;
                }
                break;

            case physicalRanges[0].from > logicalRanges[0].from:
                switch (true) {
                    case logicalRanges[0].to < physicalRanges[0].from:
                        logicalRanges.shift();
                        break;

                    default:
                        logicalRanges[0].from = physicalRanges[0].from;
                        break;
                }
                break;
        }

        if (physicalRanges.length && physicalRanges[0].from > physicalRanges[0].to) {
            physicalRanges.shift();
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

            case combinedRange.to === range.from - 1 &&
                combinedRange.description === range.description:
                combinedRange.to = range.to;
                continue;

            default:
                combinedRanges.push(range);
                continue;
        }
    }

    // Sort resulting ranges according to original sort order
    const logicalNames = logicalRanges.reduce<string[]>(
        (names, range) => (
            range.description &&
                !names.includes(range.description) &&
                names.push(range.description),
            names
        ),
        []
    );
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

    return resultRanges;
}
