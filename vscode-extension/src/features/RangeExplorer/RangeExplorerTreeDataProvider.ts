import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { ALObjectType } from "../../lib/types/ALObjectType";
import { ALRange } from "../../lib/types/ALRange";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { ConsumptionCache } from "../ConsumptionCache";
import { DisposableNinjaTreeItem, NinjaAppTreeItem, NinjaTreeItem } from "../Explorer/NinjaTreeItem";
import { TextTreeItem } from "../Explorer/TextTreeItem";
import { getSeverityFromRemaining, severityIconMap } from "../Explorer/TreeItemDecoration";

export function createRangeEplorerRoot(app: ALApp, update: (item: NinjaTreeItem) => void): DisposableNinjaTreeItem {
    const item: DisposableNinjaTreeItem = {
        app,
        path: "",
        label: app.name || app.manifest.name,
        icon: ThemeIcon.Folder,
        tooltip: `${app.manifest.name} v${app.manifest.version}`,
        description: app.manifest.version,
        contextValue: "ninja-folder", // Referenced in package.json "when" view condition
        getChildren: () => {
            const hasLogical = app.config.idRanges.length > 0;
            const hasObject = app.config.objectTypesSpecified.length > 0;

            let children: NinjaTreeItem[] = [];

            if (!hasLogical && !hasObject) {
                children = app.manifest.idRanges.map(range => createRangeTreeItemProvider(item, range, false));
            } else {
                [createPhysicalRangesTreeItemProvider(item as NinjaAppTreeItem)];
            }

            if (hasLogical) {
                children!.push(createLogicalRangesTreeItemProvider(item as NinjaAppTreeItem));
            }
            if (hasObject) {
                children!.push(createObjectRangesTreeItemProvider(item as NinjaAppTreeItem));
            }

            return children;
        },

        dispose: () => {
            subscription.dispose();
        },
    };

    const subscription = ConsumptionCache.instance.onConsumptionUpdate(app.hash, () => {
        update(item);
    });

    return item;
}

function createRangeTreeItemProvider(
    parent: NinjaTreeItem,
    range: ALRange,
    dropLogicalName: boolean
): NinjaAppTreeItem {
    const app = parent.app!;
    const description = dropLogicalName ? "" : (range as NinjaALRange).description || "";
    const addition = description && !dropLogicalName ? ` (${description})` : "";
    const path = `${range.from}-${range.to}`;

    const item: NinjaAppTreeItem = {
        app,
        parent: parent as NinjaAppTreeItem,
        path,
        label: `${range.from}..${range.to}`,
        icon: new ThemeIcon("arrow-both"),
        tooltip: `From ${range.from} to ${range.to}${addition}`,
        description,

        getChildren: () => {
            const consumption = ConsumptionCache.instance.getConsumption(app.hash) || {};

            const children: NinjaAppTreeItem[] = [];
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
                    createObjectTypeConsumptionTreeItemProvider(
                        item,
                        key,
                        consumption[key as ALObjectType].filter(id => id >= range.from && id <= range.to),
                        range.to - range.from + 1
                    )
                );
            }

            if (children.length === 0) {
                children.push(
                    new TextTreeItem(
                        "No consumption yet",
                        `No ids are assigned in this range (${range.from} to ${range.to}).`,
                        item
                    ) as any
                );
            }

            return children;
        },
    };

    return item;
}

function createPhysicalRangesTreeItemProvider(parent: NinjaAppTreeItem): NinjaAppTreeItem {
    const path = "ranges";
    const { app } = parent;

    const item: NinjaAppTreeItem = {
        app,
        parent,
        label: "Ranges",
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        icon: new ThemeIcon("array"),
        description: "app.json",
        tooltip: "Physical ranges defined in app.json",
        path,

        getChildren: () => {
            const ranges = app.manifest.idRanges;
            return ranges.map(range => createRangeTreeItemProvider(item, range, false));
        },
    };

    return item;
}

function createLogicalRangesTreeItemProvider(parent: NinjaAppTreeItem): NinjaAppTreeItem {
    const path = "logicalranges";
    const { app } = parent;

    const item: NinjaAppTreeItem = {
        app,
        parent,
        label: "Logical Ranges",
        icon: new ThemeIcon("tag"),
        description: ".objidconfig",
        tooltip: "Logical ranges defined in .objidconfig",
        path,

        getChildren: () => {
            const logicalRangeNames = app.config.logicalRangeNames;
            const logicalRanges = app.config.idRanges;

            const children = logicalRangeNames.map(name => {
                const compareName = (name || "").toLowerCase().trim();
                const ranges = logicalRanges.filter(
                    range => (range.description || "").toLowerCase().trim() === compareName
                );
                return ranges.length === 1
                    ? createRangeTreeItemProvider(item, ranges[0], false)
                    : createLogicalRangeTreeItemProvider(item, name, logicalRanges);
            });

            return children;
        },
    };

    return item;
}

function createLogicalRangeTreeItemProvider(
    parent: NinjaAppTreeItem,
    name: string,
    children: NinjaALRange[]
): NinjaAppTreeItem {
    const { app } = parent;
    const nameLower = (name || "").toLowerCase().trim();
    const ranges = children.filter(range => (range.description || "").toLowerCase().trim() === nameLower);
    const path = `${name || "$noname$"}`;

    const item: NinjaAppTreeItem = {
        app,
        parent,
        label: name,
        icon: new ThemeIcon("tag"),
        tooltip: `Logical range named ${name}`,
        path,
        getChildren: () => ranges.map(range => createRangeTreeItemProvider(item, range, true)),
    };

    return item;
}

function createObjectTypeLogicalRangeTreeItemProvider(
    parent: NinjaAppTreeItem,
    objectType: string,
    name: string,
    children: NinjaALRange[]
): NinjaAppTreeItem {
    const { app } = parent;
    const nameLower = (name || "").toLowerCase().trim();
    const ranges = children.filter(range => (range.description || "").toLowerCase().trim() === nameLower);
    const path = `${name || "$noname$"}`;

    const item: NinjaAppTreeItem = {
        app,
        parent,
        label: name,
        icon: new ThemeIcon("tag"),
        tooltip: `Logical ranges for ${objectType} objects, named ${name}, defined in .objidconfig`,
        path,

        getChildren: () => {
            const children = ranges.map(range =>
                createObjectTypeRangeConsumptionTreeItemProvider(item, range, objectType, true)
            );
            return children;
        },
    };

    return item;
}

function createObjectRangesTreeItemProvider(parent: NinjaAppTreeItem): NinjaAppTreeItem {
    const { app } = parent;
    const path = "objectranges";

    const item: NinjaAppTreeItem = {
        app,
        parent,
        label: "Object Ranges",
        icon: new ThemeIcon("group-by-ref-type"),
        description: ".objidconfig",
        tooltip: "Logical ranges for object types, defined in .objidconfig",
        path,

        getChildren: () => {
            const children = app.config.objectTypesSpecified.map(objectType =>
                createObjectTypeRangesTreeItemProvider(item, objectType)
            );

            return children;
        },
    };

    return item;
}

function createObjectTypeRangesTreeItemProvider(parent: NinjaAppTreeItem, objectType: string): NinjaAppTreeItem {
    const { app } = parent;
    const path = objectType;

    const item: NinjaAppTreeItem = {
        app,
        parent,
        label: objectType,
        icon: new ThemeIcon("layout"),
        tooltip: `Logical ranges for ${objectType} objects, defined in .objidconfig`,
        path,

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
                    ? createObjectTypeRangeConsumptionTreeItemProvider(item, ranges[0], objectType, false)
                    : createObjectTypeLogicalRangeTreeItemProvider(item, objectType, name, logicalRanges);
            });

            return children;
        },
    };

    return item;
}

function createObjectTypeConsumptionTreeItemProvider(
    parent: NinjaAppTreeItem,
    objectType: string,
    ids: number[],
    size: number
): NinjaAppTreeItem {
    const { app } = parent;
    const path = objectType;
    const pct = Math.round((ids.length / size) * 100);
    const remaining = size - ids.length;
    const severity = getSeverityFromRemaining(remaining);
    const icon = severityIconMap[severity] || "check";

    return {
        app,
        parent,
        label: objectType,
        icon: new ThemeIcon(icon),
        path,
        collapsibleState: TreeItemCollapsibleState.None,
        tooltip: `${ids.length} assigned ${objectType} object(s), ${remaining} available`,
        description: `${pct}% (${ids.length} of ${size})`,
        decoration:
            remaining > 10
                ? undefined
                : {
                      badge: `${remaining}`,
                      propagate: true,
                      severity,
                  },
    };
}

function createObjectTypeRangeConsumptionTreeItemProvider(
    parent: NinjaAppTreeItem,
    range: ALRange,
    objectType: string,
    dropLogicalName: boolean
): NinjaAppTreeItem {
    const { app } = parent;
    const description = dropLogicalName ? "" : (range as NinjaALRange).description || "";
    const addition = description && !dropLogicalName ? ` (${description})` : "";
    const path = `${range.from}-${range.to}`;

    const consumption = ConsumptionCache.instance.getConsumption(app.hash) || {};
    const objConsumption = consumption[objectType as ALObjectType] || [];
    const ids = objConsumption.filter(id => id >= range.from && id <= range.to);
    const size = range.to - range.from + 1;
    const remaining = size - ids.length;
    const pct = Math.round((ids.length / size) * 100);
    const severity = getSeverityFromRemaining(remaining);
    const icon = severityIconMap[severity] || "check";

    const item: NinjaAppTreeItem = {
        app,
        parent,
        label: `${range.from}..${range.to}${addition}`,
        icon: new ThemeIcon(icon),
        path,
        collapsibleState: TreeItemCollapsibleState.None,
        tooltip: `${ids.length} assigned ${objectType} object(s), ${remaining} available`,
        description: `${pct}% (${ids.length} of ${size})`,
        decoration:
            remaining > 10
                ? undefined
                : {
                      badge: `${remaining}`,
                      propagate: true,
                      severity,
                  },
    };

    return item;
}
