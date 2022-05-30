import { LogicalObjectTypeRangeConsumptionNode } from "./LogicalObjectTypeRangeConsumptionNode";
import { ThemeIcon, TreeItemLabel, TreeItemCollapsibleState } from "vscode";
import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { AppAwareDescendantNode, AppAwareNode } from "../../AppAwareNode";
import { Node } from "../../Node";
import {
    GoToDefinitionCommandContext,
    GoToDefinitionContext,
    GoToDefinitionFile,
    GoToDefinitionType,
} from "../../../../commands/contexts/GoToDefinitionCommandContext";
import { ContextValues } from "../../ContextValues";
import { NinjaIcon } from "../../../../lib/NinjaIcon";

/**
 * Represents a logical range defined for a specific object type.
 *
 * Each node instance from this class represents a unique value specified in `description` property under an
 * object type specified under `objectRanges` in `.objidconfig`. Label for this node is always equal to the
 * `description` property.
 *
 * This node will only show for such object-type ranges where there are multiple different `from..to` instances
 * with the same `description` property. Otherwise {@link LogicalObjectTypeRangeConsumptionNode} is shown directly.
 *
 * This node always contains at least two children of {@link LogicalObjectTypeRangeConsumptionNode} type.
 */
export class LogicalObjectTypeRangesNode
    extends AppAwareDescendantNode
    implements GoToDefinitionCommandContext<NinjaALRange>
{
    private readonly _objectType: string;
    private readonly _name: string;
    private readonly _ranges: NinjaALRange[];
    protected override readonly _iconPath = NinjaIcon["object-logical-range"];
    protected override readonly _uriPathPart: string;
    protected override readonly _label: string | TreeItemLabel;
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;

    constructor(parent: AppAwareNode, objectType: string, name: string, ranges: NinjaALRange[]) {
        super(parent);
        this._objectType = objectType;
        this._name = name;
        this._ranges = ranges;
        this._label = name;
        this._tooltip = `Logical ranges for ${objectType} objects, named ${name}, defined in .objidconfig`;
        this._uriPathPart = name || "_";
        this._contextValues.push(ContextValues.GotoDef);
    }

    protected override getChildren(): Node[] {
        const children = this._ranges.map(
            range => new LogicalObjectTypeRangeConsumptionNode(this, this._objectType, range, false)
        );
        return children;
    }

    public get goto(): GoToDefinitionContext<NinjaALRange> {
        return {
            app: this.app,
            file: GoToDefinitionFile.Configuration,
            type: GoToDefinitionType.ObjectTypeRanges,
            objectType: this._objectType,
            logicalName: this._name,
        };
    }
}
