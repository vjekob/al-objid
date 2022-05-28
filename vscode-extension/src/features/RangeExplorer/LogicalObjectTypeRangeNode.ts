import { LogicalObjectTypeRangeConsumptionNode } from "./LogicalObjectTypeRangeConsumptionNode";
import { Uri, ThemeIcon, TreeItemLabel, TreeItemCollapsibleState } from "vscode";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { AppAwareDescendantNode, AppAwareNode } from "../Explorer/AppAwareNode";
import { Node } from "../Explorer/Node";

/**
 * Represents a logical range defined for a specific object type.
 *
 * Each node instance from this class represents a unique value specified in `description` property under an
 * object type specified under `objectRanges` in `.objidconfig`.
 */
export class LogicalObjectTypeRangeNode extends AppAwareDescendantNode {
    private readonly _objectType: string;
    private readonly _ranges: NinjaALRange[];
    protected override readonly _iconPath = new ThemeIcon("tag");
    protected override readonly _uriPathPart: string;
    protected override readonly _label: string | TreeItemLabel;
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;

    constructor(parent: AppAwareNode, objectType: string, name: string, ranges: NinjaALRange[]) {
        super(parent);
        this._objectType = objectType;
        this._ranges = ranges;
        this._label = name;
        this._tooltip = `Logical ranges for ${objectType} objects, named ${name}, defined in .objidconfig`;
        this._uriPathPart = name || "_";
    }

    protected override getChildren(): Node[] {
        const children = this._ranges.map(
            range => new LogicalObjectTypeRangeConsumptionNode(this, this._objectType, range, false)
        );
        return children;
    }
}
