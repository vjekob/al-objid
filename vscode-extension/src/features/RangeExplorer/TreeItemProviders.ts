import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { ALObjectType } from "../../lib/types/ALObjectType";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { ALRange } from "../../lib/types/ALRange";
import { ConsumptionCache } from "../ConsumptionCache";
import { INinjaTreeItem, NinjaTreeItem, UpdateNinjaTreeItem } from "../Explorer/NinjaTreeItem";
import { NinjaTreeItemProvider } from "../Explorer/NinjaTreeItemProvider";
import { TextTreeItem } from "../Explorer/TextTreeItem";
import { TreeItemSeverity } from "../Explorer/TreeItemSeverity";
import { ExpandCollapseController } from "../Explorer/ExpandCollapseController";

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

export function getFolderTreeItemProvider(app: ALApp, update: UpdateNinjaTreeItem): NinjaTreeItemProvider {
    const subscription = ConsumptionCache.instance.onConsumptionUpdate(update => {
        if (update.appId !== app.hash) {
            return;
        }
    });

    return {
        getLabel: () => app.manifest.name,
        getIcon: () => ThemeIcon.Folder,
        getUriPath: () => "",
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getTooltip: () => `${app.manifest.name} v${app.manifest.version}`,
        getDescription: () => app.manifest.version,
        getContextValue: () => "ninja-folder", // Referenced in package.json "when" view condition

        getChildren: () => {
            const hasLogical = app.config.idRanges.length > 0;
            const hasObject = app.config.objectTypesSpecified.length > 0;

            let children: INinjaTreeItem[] = [];

            if (!hasLogical && !hasObject) {
                children = app.manifest.idRanges.map(
                    range => new NinjaTreeItem(app, getRangeTreeItemProvider(app, range, false, ""))
                );
            } else {
                children = [new NinjaTreeItem(app, getPhysicalRangesTreeItemProvider(app))];
            }

            if (hasLogical) {
                children!.push(new NinjaTreeItem(app, getLogicalRangesTreeItemProvider(app)));
            }
            if (hasObject) {
                children!.push(new NinjaTreeItem(app, getObjectRangesTreeItemProvider(app)));
            }

            return children;
        },

        dispose: () => {
            subscription.dispose();
        },
    };
}

export function getRangeTreeItemProvider(
    app: ALApp,
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

        getChildren: parent => {
            const consumption = ConsumptionCache.instance.getConsumption(app.hash) || {};

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
                        app,
                        getObjectTypeConsumptionTreeItemProvider(
                            app,
                            key,
                            consumption[key as ALObjectType].filter(id => id >= range.from && id <= range.to),
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
                        parent
                    )
                );
            }

            return children;
        },
    };
}

export function getPhysicalRangesTreeItemProvider(app: ALApp): NinjaTreeItemProvider {
    const path = "/ranges";

    return {
        getLabel: () => "Ranges",
        getCollapsibleState: () => TreeItemCollapsibleState.Collapsed,
        getIcon: () => new ThemeIcon("array"),
        getDescription: () => "app.json",
        getTooltip: () => "Physical ranges defined in app.json",
        getUriPath: () => path,

        getChildren: () => {
            const ranges = app.manifest.idRanges;
            return ranges.map(range => new NinjaTreeItem(app, getRangeTreeItemProvider(app, range, false, path)));
        },
    };
}

export function getLogicalRangesTreeItemProvider(app: ALApp): NinjaTreeItemProvider {
    const path = "/logicalranges";

    return {
        getLabel: () => "Logical Ranges",
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("tag"),
        getDescription: () => ".objidconfig",
        getTooltip: () => "Logical ranges defined in .objidconfig",
        getUriPath: () => path,

        getChildren: () => {
            const logicalRangeNames = app.config.logicalRangeNames;
            const logicalRanges = app.config.idRanges;

            const children = logicalRangeNames.map(name => {
                const compareName = (name || "").toLowerCase().trim();
                const ranges = logicalRanges.filter(
                    range => (range.description || "").toLowerCase().trim() === compareName
                );
                return ranges.length === 1
                    ? new NinjaTreeItem(app, getRangeTreeItemProvider(app, ranges[0], false, path))
                    : new NinjaTreeItem(app, getLogicalRangeTreeItemProvider(app, name, path, logicalRanges));
            });

            return children;
        },
    };
}

export function getLogicalRangeTreeItemProvider(
    manifest: ALApp,
    name: string,
    pathSoFar: string,
    children: NinjaALRange[]
): NinjaTreeItemProvider {
    const nameLower = (name || "").toLowerCase().trim();
    const ranges = children.filter(range => (range.description || "").toLowerCase().trim() === nameLower);
    const path = `${pathSoFar}/${name || "$noname$"}`;

    return {
        getLabel: () => name,
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("tag"),
        getTooltip: () => `Logical range named ${name}`,
        getUriPath: () => path,

        getChildren: () => {
            const children = ranges.map(
                range => new NinjaTreeItem(manifest, getRangeTreeItemProvider(manifest, range, true, path))
            );

            return children;
        },
    };
}

export function getObjectTypeLogicalRangeTreeItemProvider(
    manifest: ALApp,
    objectType: string,
    name: string,
    pathSoFar: string,
    children: NinjaALRange[]
): NinjaTreeItemProvider {
    const nameLower = (name || "").toLowerCase().trim();
    const ranges = children.filter(range => (range.description || "").toLowerCase().trim() === nameLower);
    const path = `${pathSoFar}/${name || "$noname$"}`;

    return {
        getLabel: () => name,
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("tag"),
        getTooltip: () => `Logical ranges for ${objectType} objects, named ${name}, defined in .objidconfig`,
        getUriPath: () => path,

        getChildren: () => {
            const children = ranges.map(
                range =>
                    new NinjaTreeItem(
                        manifest,
                        getObjectTypeRangeConsumptionTreeItemProvider(manifest, range, objectType, true, path)
                    )
            );

            return children;
        },
    };
}

export function getObjectRangesTreeItemProvider(app: ALApp): NinjaTreeItemProvider {
    const path = "/objectranges";
    return {
        getLabel: () => "Object Ranges",
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("group-by-ref-type"),
        getDescription: () => ".objidconfig",
        getTooltip: () => "Logical ranges for object types, defined in .objidconfig",
        getUriPath: () => path,

        getChildren: () => {
            const children = app.config.objectTypesSpecified.map(
                objectType => new NinjaTreeItem(app, getObjectTypeRangesTreeItemProvider(app, objectType))
            );

            return children;
        },
    };
}

export function getObjectTypeRangesTreeItemProvider(app: ALApp, objectType: string): NinjaTreeItemProvider {
    const path = `/objectranges/${objectType}`;

    return {
        getLabel: () => objectType,
        getCollapsibleState: () => TreeItemCollapsibleState.Expanded,
        getIcon: () => new ThemeIcon("layout"),
        getTooltip: () => `Logical ranges for ${objectType} objects, defined in .objidconfig`,
        getUriPath: () => path,

        getChildren: () => {
            const logicalRanges = app.config.getObjectTypeRanges(objectType);
            const logicalRangeNames = logicalRanges.reduce<string[]>((results, range) => {
                if (
                    results.find(
                        left =>
                            (left || "").toLowerCase().trim() === (range.description || "").toLocaleLowerCase().trim()
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
                          app,
                          getObjectTypeRangeConsumptionTreeItemProvider(app, ranges[0], objectType, false, path)
                      )
                    : new NinjaTreeItem(
                          app,
                          getObjectTypeLogicalRangeTreeItemProvider(app, objectType, name, path, logicalRanges)
                      );
            });

            return children;
        },
    };
}

export function getObjectTypeConsumptionTreeItemProvider(
    app: ALApp,
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
    app: ALApp,
    range: ALRange,
    objectType: string,
    dropLogicalName: boolean,
    pathSoFar: string
): NinjaTreeItemProvider {
    const description = dropLogicalName ? "" : (range as NinjaALRange).description || "";
    const addition = description && !dropLogicalName ? ` (${description})` : "";
    const path = `${pathSoFar}/${range.from}-${range.to}`;

    const consumption = ConsumptionCache.instance.getConsumption(app.hash) || {};
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
