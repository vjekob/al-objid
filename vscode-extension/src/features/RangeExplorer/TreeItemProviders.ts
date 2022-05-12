import { ThemeIcon, TreeItemCollapsibleState, Uri } from "vscode";
import { ALObjectType } from "../../lib/constants";
import { ALRange, __AppManifest_obsolete_, NinjaALRange } from "../../lib/types";
import { ConsumptionCache } from "../ConsumptionCache";
import { INinjaTreeItem, NinjaTreeItem, UpdateNinjaTreeItem } from "../Explorer/NinjaTreeItem";
import { NinjaTreeItemProvider } from "../Explorer/NinjaTreeItemProvider";
import { TextTreeItem } from "../Explorer/TextTreeItem";
import { TreeItemSeverity } from "../Explorer/TreeItemSeverity";

const severityIconMap: { [key: number]: string | undefined } = {
    [TreeItemSeverity.none]: undefined,
    [TreeItemSeverity.info]: "info",
    [TreeItemSeverity.warning]: "warning",
    [TreeItemSeverity.error]: "error",
};

function getSeverityFromRemaining(remaining: number): TreeItemSeverity {
    let severity = TreeItemSeverity.none;
    if (remaining <= 10) {
        severity = TreeItemSeverity.info;
        if (remaining <= 5) {
            severity = TreeItemSeverity.warning;
            if (remaining === 0) {
                severity = TreeItemSeverity.error;
            }
        }
    }
    return severity;
}

export function getFolderTreeItemProvider(
    manifest: __AppManifest_obsolete_,
    update: UpdateNinjaTreeItem
): NinjaTreeItemProvider {
    const subscription = ConsumptionCache.instance.onConsumptionUpdate(update => {
        if (update.appId !== manifest.id) {
            return;
        }
    });

    return {
        getLabel: () => manifest.name,
        getIcon: () => ThemeIcon.Folder,
        getUriPath: () => "",
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getTooltip: () => `${manifest.name} v${manifest.version}`,
        getDescription: () => manifest.version,
        getContextValue: () => "ninja-folder", // Referenced in package.json "when" view condition

        getChildren: () => {
            const hasLogical = manifest.ninja.config.hasIdRanges();
            const hasObject = manifest.ninja.config.explicitObjectTypeRanges.length > 0;

            let children: INinjaTreeItem[] = [];

            if (!hasLogical && !hasObject) {
                children = manifest.idRanges.map(
                    range =>
                        new NinjaTreeItem(
                            manifest,
                            getRangeTreeItemProvider(manifest, range, false, "")
                        )
                );
            } else {
                children = [
                    new NinjaTreeItem(manifest, getPhysicalRangesTreeItemProvider(manifest)),
                ];
            }

            if (hasLogical) {
                children!.push(
                    new NinjaTreeItem(manifest, getLogicalRangesTreeItemProvider(manifest))
                );
            }
            if (hasObject) {
                children!.push(
                    new NinjaTreeItem(manifest, getObjectRangesTreeItemProvider(manifest))
                );
            }

            return children;
        },

        dispose: () => {
            subscription.dispose();
        },
    };
}

export function getRangeTreeItemProvider(
    manifest: __AppManifest_obsolete_,
    range: ALRange,
    dropLogicalName: boolean,
    pathSoFar: string
): NinjaTreeItemProvider {
    const description = dropLogicalName ? "" : (range as NinjaALRange).description || "";
    const addition = description && !dropLogicalName ? ` (${description})` : "";
    const path = `${pathSoFar}/${range.from}-${range.to}`;

    return {
        getLabel: () => `${range.from}..${range.to}`,
        getIcon: () => new ThemeIcon("arrow-both"),
        getUriPath: () => path,
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getTooltip: () => `From ${range.from} to ${range.to}${addition}`,
        getDescription: () => description,

        getChildren: () => {
            const consumption = ConsumptionCache.instance.getConsumption(manifest.id) || {};

            const children: INinjaTreeItem[] = [];
            for (let key of Object.values<string>(ALObjectType)) {
                const type = key as ALObjectType;
                if (consumption[type] === undefined || consumption[type].length === 0) {
                    continue;
                }
                const ids = consumption[type].filter(id => id >= range.from && id <= range.to);
                if (ids.length === 0) {
                    continue;
                }
                children.push(
                    new NinjaTreeItem(
                        manifest,
                        getObjectTypeConsumptionTreeItemProvider(
                            manifest,
                            key,
                            consumption[key as ALObjectType].filter(
                                id => id >= range.from && id <= range.to
                            ),
                            range.to - range.from + 1,
                            path
                        )
                    )
                );
            }

            if (children.length === 0) {
                children.push(
                    new TextTreeItem(
                        "No consumption yet",
                        `No ids are assigned in this range (${range.from} to ${range.to}).`,
                        undefined
                    )
                );
            }

            return children;
        },
    };
}

export function getPhysicalRangesTreeItemProvider(
    manifest: __AppManifest_obsolete_
): NinjaTreeItemProvider {
    const path = "/ranges";

    return {
        getLabel: () => "Ranges",
        getCollapsibleState: () => TreeItemCollapsibleState.Collapsed,
        getIcon: () => new ThemeIcon("array"),
        getDescription: () => "app.json",
        getTooltip: () => "Physical ranges defined in app.json",
        getUriPath: () => path,

        getChildren: () => {
            const ranges = manifest.idRanges;
            return ranges.map(
                range =>
                    new NinjaTreeItem(
                        manifest,
                        getRangeTreeItemProvider(manifest, range, false, path)
                    )
            );
        },
    };
}

export function getLogicalRangesTreeItemProvider(
    manifest: __AppManifest_obsolete_
): NinjaTreeItemProvider {
    const path = "/logicalranges";

    return {
        getLabel: () => "Logical Ranges",
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("tag"),
        getDescription: () => ".objidconfig",
        getTooltip: () => "Logical ranges defined in .objidconfig",
        getUriPath: () => path,

        getChildren: () => {
            const logicalRangeNames = manifest.ninja.config.logicalRangeNames;
            const logicalRanges = manifest.ninja.config.idRanges;

            const children = logicalRangeNames.map(name => {
                const compareName = (name || "").toLowerCase().trim();
                const ranges = logicalRanges.filter(
                    range => (range.description || "").toLowerCase().trim() === compareName
                );
                return ranges.length === 1
                    ? new NinjaTreeItem(
                          manifest,
                          getRangeTreeItemProvider(manifest, ranges[0], false, path)
                      )
                    : new NinjaTreeItem(
                          manifest,
                          getLogicalRangeTreeItemProvider(manifest, name, path, logicalRanges)
                      );
            });

            return children;
        },
    };
}

export function getLogicalRangeTreeItemProvider(
    manifest: __AppManifest_obsolete_,
    name: string,
    pathSoFar: string,
    children: NinjaALRange[]
): NinjaTreeItemProvider {
    const nameLower = (name || "").toLowerCase().trim();
    const ranges = children.filter(
        range => (range.description || "").toLowerCase().trim() === nameLower
    );
    const path = `${pathSoFar}/${name || "$noname$"}`;

    return {
        getLabel: () => name,
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("tag"),
        getTooltip: () => `Logical range named ${name}`,
        getUriPath: () => path,

        getChildren: () => {
            const children = ranges.map(
                range =>
                    new NinjaTreeItem(
                        manifest,
                        getRangeTreeItemProvider(manifest, range, true, path)
                    )
            );

            return children;
        },
    };
}

export function getObjectTypeLogicalRangeTreeItemProvider(
    manifest: __AppManifest_obsolete_,
    objectType: string,
    name: string,
    pathSoFar: string,
    children: NinjaALRange[]
): NinjaTreeItemProvider {
    const nameLower = (name || "").toLowerCase().trim();
    const ranges = children.filter(
        range => (range.description || "").toLowerCase().trim() === nameLower
    );
    const path = `${pathSoFar}/${name || "$noname$"}`;

    return {
        getLabel: () => name,
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("tag"),
        getTooltip: () =>
            `Logical ranges for ${objectType} objects, named ${name}, defined in .objidconfig`,
        getUriPath: () => path,

        getChildren: () => {
            const children = ranges.map(
                range =>
                    new NinjaTreeItem(
                        manifest,
                        getObjectTypeRangeConsumptionTreeItemProvider(
                            manifest,
                            range,
                            objectType,
                            true,
                            path
                        )
                    )
            );

            return children;
        },
    };
}

export function getObjectRangesTreeItemProvider(
    manifest: __AppManifest_obsolete_
): NinjaTreeItemProvider {
    const path = "/objectranges";
    return {
        getLabel: () => "Object Ranges",
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("group-by-ref-type"),
        getDescription: () => ".objidconfig",
        getTooltip: () => "Logical ranges for object types, defined in .objidconfig",
        getUriPath: () => path,

        getChildren: () => {
            const objectTypes = manifest.ninja.config.explicitObjectTypeRanges;

            const children = objectTypes.map(
                objectType =>
                    new NinjaTreeItem(
                        manifest,
                        getObjectTypeRangesTreeItemProvider(manifest, objectType)
                    )
            );

            return children;
        },
    };
}

export function getObjectTypeRangesTreeItemProvider(
    manifest: __AppManifest_obsolete_,
    objectType: string
): NinjaTreeItemProvider {
    const path = `/objectranges/${objectType}`;

    return {
        getLabel: () => objectType,
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("layout"),
        getTooltip: () => `Logical ranges for ${objectType} objects, defined in .objidconfig`,
        getUriPath: () => path,

        getChildren: () => {
            const logicalRanges = manifest.ninja.config.getObjectRanges(objectType);
            const logicalRangeNames = logicalRanges.reduce<string[]>((results, range) => {
                if (
                    results.find(
                        left =>
                            (left || "").toLowerCase().trim() ===
                            (range.description || "").toLocaleLowerCase().trim()
                    )
                ) {
                    return results;
                }
                results.push(range.description);
                return results;
            }, []);

            const children = logicalRangeNames.map(name => {
                const compareName = (name || "").toLowerCase().trim();
                const ranges = logicalRanges.filter(
                    range => (range.description || "").toLowerCase().trim() === compareName
                );
                return ranges.length === 1
                    ? new NinjaTreeItem(
                          manifest,
                          getObjectTypeRangeConsumptionTreeItemProvider(
                              manifest,
                              ranges[0],
                              objectType,
                              false,
                              path
                          )
                      )
                    : new NinjaTreeItem(
                          manifest,
                          getObjectTypeLogicalRangeTreeItemProvider(
                              manifest,
                              objectType,
                              name,
                              path,
                              logicalRanges
                          )
                      );
            });

            return children;
        },
    };
}

export function getObjectTypeConsumptionTreeItemProvider(
    manifest: __AppManifest_obsolete_,
    objectType: string,
    ids: number[],
    size: number,
    pathSoFar: string
): NinjaTreeItemProvider {
    const path = `${pathSoFar}/${objectType}`;
    const pct = Math.round((ids.length / size) * 100);
    const remaining = size - ids.length;
    const severity = getSeverityFromRemaining(remaining);
    const icon = severityIconMap[severity] || "check";

    return {
        getLabel: () => objectType,
        getIcon: () => new ThemeIcon(icon),
        getUriPath: () => path,
        getCollapsibleState: () => TreeItemCollapsibleState.None,
        getTooltip: () => `${ids.length} assigned ${objectType} object(s), ${remaining} available`,
        getDescription: () => `${pct}% (${ids.length} of ${size})`,
        getDecoration: () => {
            if (remaining > 10) {
                return undefined;
            }
            return {
                badge: `${remaining}`,
                propagate: true,
                severity,
            };
        },
    };
}

export function getObjectTypeRangeConsumptionTreeItemProvider(
    manifest: __AppManifest_obsolete_,
    range: ALRange,
    objectType: string,
    dropLogicalName: boolean,
    pathSoFar: string
): NinjaTreeItemProvider {
    const description = dropLogicalName ? "" : (range as NinjaALRange).description || "";
    const addition = description && !dropLogicalName ? ` (${description})` : "";
    const path = `${pathSoFar}/${range.from}-${range.to}`;

    const consumption = ConsumptionCache.instance.getConsumption(manifest.id) || {};
    const objConsumption = consumption[objectType as ALObjectType] || [];
    const ids = objConsumption.filter(id => id >= range.from && id <= range.to);
    const size = range.to - range.from + 1;
    const remaining = size - ids.length;
    const pct = Math.round((ids.length / size) * 100);
    const severity = getSeverityFromRemaining(remaining);
    const icon = severityIconMap[severity] || "check";

    return {
        getLabel: () => `${range.from}..${range.to}${addition}`,
        getIcon: () => new ThemeIcon(icon),
        getUriPath: () => path,
        getCollapsibleState: () => TreeItemCollapsibleState.None,
        getTooltip: () => `${ids.length} assigned ${objectType} object(s), ${remaining} available`,
        getDescription: () => `${pct}% (${ids.length} of ${size})`,
        getDecoration: () => {
            if (remaining > 10) {
                return undefined;
            }
            return {
                badge: `${remaining}`,
                propagate: true,
                severity,
            };
        },
    };
}
