import { TreeItemCollapsibleState } from "vscode";
import { ALObjectType } from "../../../lib/types/ALObjectType";
import { NinjaALRange } from "../../../lib/types/NinjaALRange";
import { AppAwareNode } from "../AppAwareNode";
import { DecorationSeverity, getSeverityFromRemaining, RangeSeverityIcons } from "../DecorationSeverity";
import { Node } from "../Node";
import { RangeNode } from "./RangeNode";

export class LogicalObjectTypeRangeConsumptionNode extends RangeNode {
    protected override readonly _includeLogicalNameInDescription = false;
    protected override readonly _includeLogicalNameInLabel: boolean;
    protected override _collapsibleState = TreeItemCollapsibleState.None;

    constructor(parent: AppAwareNode, objectType: string, range: NinjaALRange, includeName: boolean) {
        super(parent, range);
        this._includeLogicalNameInLabel = includeName;

        const objConsumption = this._consumption[objectType as ALObjectType] || [];
        const ids = objConsumption.filter(id => id >= range.from && id <= range.to);
        const size = range.to - range.from + 1;
        const remaining = size - ids.length;
        const pct = Math.round((ids.length / size) * 100);
        const severity = getSeverityFromRemaining(remaining, size);

        if (ids.length > 0) {
            this._iconPath = RangeSeverityIcons[severity]!;
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
        } else {
            this._description = "(no consumption)";
            this._decoration = {
                badge: "-",
                severity: DecorationSeverity.inactive,
                tooltip: `No consumption has been recorded`,
            };
        }
    }

    protected override calculateChildren(): Node[] {
        // This node type has no children, but parent does
        return [];
    }
}
