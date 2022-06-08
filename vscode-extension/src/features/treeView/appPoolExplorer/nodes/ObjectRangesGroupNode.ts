import { TreeItemCollapsibleState } from "vscode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { Node } from "../../Node";
import { AppPoolAwareDescendantNode, AppPoolAwareNode } from "./AppPoolAwareNode";
import { LogicalObjectTypeNode } from "./LogicalObjectTypeNode";

/**
 * Represents a node that groups logical ranges for an individual object type. It contains child nodes where each
 * node represents an object type specified under `objectTypes` property of `.objidconfig`.
 */
export class ObjectRangesGroupNode extends AppPoolAwareDescendantNode {
    protected override _iconPath = NinjaIcon["object-ranges"];
    protected override _uriPathPart = "objectranges";
    protected override readonly _label = "Object Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = ".objidconfig";
    protected override readonly _tooltip = "Logical ranges for object types, defined in .objidconfig";

    constructor(parent: AppPoolAwareNode) {
        super(parent);
    }

    protected override getChildren(): Node[] {
        return this.rootNode.objectTypesSpecified.map(objectType => new LogicalObjectTypeNode(this, objectType));
    }
}
