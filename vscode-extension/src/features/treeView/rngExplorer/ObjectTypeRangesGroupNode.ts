import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { AppAwareNode, AppAwareDescendantNode } from "../AppAwareNode";
import { Node } from "../Node";
import { LogicalObjectTypeNode } from "../rangeExplorer/LogicalObjectTypeNode";

/**
 * Represents a node that groups logical ranges for an individual object type. It contains child nodes where each
 * node represents an object type specified under `objectTypes` property of `.objidconfig`.
 */
export class ObjectTypeRangesGroupNode extends AppAwareDescendantNode {
    protected override _iconPath = new ThemeIcon("group-by-ref-type");
    protected override _uriPathPart = "objectranges";
    protected override readonly _label = "Object Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = ".objidconfig";
    protected override readonly _tooltip = "Logical ranges for object types, defined in .objidconfig";

    constructor(parent: AppAwareNode) {
        super(parent);
    }

    protected override getChildren(): Node[] {
        return this.app.config.objectTypesSpecified.map(objectType => new LogicalObjectTypeNode(this, objectType));
    }
}
