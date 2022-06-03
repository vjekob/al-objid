import { TreeItemCollapsibleState } from "vscode";
import { ALObjectType } from "../../../../lib/types/ALObjectType";
import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { AppAwareNode } from "../../AppAwareNode";
import { ContextValues } from "../../ContextValues";
import { DecorationSeverity, getSeverityFromRemaining, RangeSeverityIcons } from "../../DecorationSeverity";
import { Node } from "../../Node";
import {
    GoToDefinitionCommandContext,
    GoToDefinitionContext,
    GoToDefinitionFile,
    GoToDefinitionType,
} from "../../../../commands/contexts/GoToDefinitionCommandContext";
import { RangeNode } from "./RangeNode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";

/**
 * Represents a object-type logical range defined under specific object type under `objectRanges` in `.objidconfig`.
 * Each node of this type shows label that includes range (from..to) and may include logical range name in
 * parentheses.
 *
 * This is a consumption node, so it shows consumption information and may show decorations.
 */
export class LogicalObjectTypeRangeConsumptionNode
    extends RangeNode<NinjaALRange>
    implements GoToDefinitionCommandContext<NinjaALRange>
{
    private readonly _objectType: string;
    protected override readonly _includeLogicalNameInDescription = false;
    protected override readonly _includeLogicalNameInLabel: boolean;
    protected override _collapsibleState = TreeItemCollapsibleState.None;

    constructor(parent: AppAwareNode, objectType: string, range: NinjaALRange, includeName: boolean) {
        super(parent, range);
        this._objectType = objectType;
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
            this._iconPath = NinjaIcon["arrow-both-inactive"];
        }

        this._contextValues.push(ContextValues.GotoDef);
    }

    protected override calculateChildren(): Node[] {
        // This node type has no children, but extended type does, so we must override!
        return [];
    }

    get goto(): GoToDefinitionContext<NinjaALRange> {
        return {
            app: this.app,
            file: GoToDefinitionFile.Configuration,
            type: GoToDefinitionType.ObjectTypeRange,
            range: this._range,
            objectType: this._objectType,
        };
    }
}
