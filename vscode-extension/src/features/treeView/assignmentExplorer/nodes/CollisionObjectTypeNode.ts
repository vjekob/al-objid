import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { AppAwareDescendantNode, AppAwareNode } from "../../AppAwareNode";
import { TreeItemLabel, TreeItemCollapsibleState, MarkdownString } from "vscode";
import { ALObjectType } from "../../../../lib/types/ALObjectType";
import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { Node } from "../../Node";
import { CollisionNode } from "./CollisionNode";

/**
 * Represents an object type node under collision group node.
 */
export class CollisionObjectTypeNode extends AppAwareDescendantNode {
    protected override readonly _iconPath = NinjaIcon["object-collision"];
    protected override readonly _uriPathPart: string;
    protected override readonly _label: string | TreeItemLabel;
    protected override readonly _collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Expanded;
    protected _includeLogicalNameInDescription = false;
    protected _includeLogicalNameInLabel = false;
    private _objects: ALObject[];

    constructor(parent: AppAwareNode, objectType: ALObjectType, objects: ALObject[]) {
        super(parent);
        this._label = objectType;
        this._uriPathPart = objectType;
        this._objects = objects;
        this._tooltip = new MarkdownString(`**${objects.length}** manually assigned ${objectType} object(s)`);
    }

    protected override getChildren(): Node[] {
        const children: Node[] = [];

        for (let object of this._objects) {
            children.push(new CollisionNode(this, object));
        }

        return children;
    }
}
