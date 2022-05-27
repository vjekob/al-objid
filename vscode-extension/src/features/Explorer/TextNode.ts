import { TreeItemCollapsibleState, TreeItem } from "vscode";
import { Node } from "./Node";

export class TextNode extends Node {
    protected _label = "";
    protected _collapsibleState = TreeItemCollapsibleState.None;

    constructor(parent: Node, description: string) {
        super(parent);
        this._description = description;
    }

    protected override completeTreeItem(item: TreeItem): void {
        item.description = this._description;
    }
}
