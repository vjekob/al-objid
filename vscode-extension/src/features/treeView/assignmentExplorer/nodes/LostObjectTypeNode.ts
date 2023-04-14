import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { AppAwareDescendantNode, AppAwareNode } from "../../AppAwareNode";
import { TreeItemLabel, TreeItemCollapsibleState, MarkdownString } from "vscode";
import { ALObjectType } from "../../../../lib/types/ALObjectType";
import { Node } from "../../Node";
import { LostNode } from "./LostNode";
import { AssignedALObject } from "../../../../lib/types/AssignedALObject";

/**
 * Represents an object type node under lost group node.
 */
export class LostObjectTypeNode extends AppAwareDescendantNode {
    protected override readonly _iconPath = NinjaIcon["object-lost"];
    protected override readonly _uriPathPart: string;
    protected override readonly _label: string | TreeItemLabel;
    protected override readonly _collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Expanded;
    protected _includeLogicalNameInDescription = false;
    protected _includeLogicalNameInLabel = false;
    private _objects: AssignedALObject[];

    constructor(parent: AppAwareNode, objectType: ALObjectType, objects: AssignedALObject[]) {
        super(parent);
        this._label = objectType;
        this._uriPathPart = objectType;
        this._objects = objects;
        this._tooltip = new MarkdownString(`**${objects.length}** unused ${objectType} object ID(s)`);
    }

    protected override getChildren(): Node[] {
        const children: Node[] = [];

        for (let object of this._objects) {
            children.push(new LostNode(this, object));
        }

        return children;
    }
}
