import { Uri, ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { AppAwareNode } from "../AppAwareNode";
import { getSeverityFromRemaining, ObjectSeverityIcons } from "../DecorationSeverity";
import { ObjectTypeNode } from "./ObjectTypeNode";

export class ObjectTypeConsumptionNode extends ObjectTypeNode {
    protected _iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon;
    protected _collapsibleState = TreeItemCollapsibleState.None;

    constructor(parent: AppAwareNode, objectType: string, ids: number[], size: number) {
        super(parent, objectType);

        const pct = Math.round((ids.length / size) * 100);
        const remaining = size - ids.length;
        const severity = getSeverityFromRemaining(remaining, size);
        this._iconPath = ObjectSeverityIcons[severity]!;
        this._tooltip = `${ids.length} assigned ${objectType} object(s), ${remaining} available`;
        this._description = `${pct}% (${ids.length} of ${size})`;
        this._decoration =
            remaining > 10
                ? undefined
                : {
                      badge: `${remaining}`,
                      propagate: true,
                      severity,
                  };
    }
}
