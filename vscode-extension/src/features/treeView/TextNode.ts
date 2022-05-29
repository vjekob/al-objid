import { TreeItemCollapsibleState, TreeItem } from "vscode";
import { Node } from "./Node";

export class TextNode extends Node {
    protected _label = "";
    protected _collapsibleState = TreeItemCollapsibleState.None;

    constructor(description: string, tooltip: string) {
        super(undefined);
        this._description = description;
        this._tooltip = tooltip;
    }

    protected override completeTreeItem(item: TreeItem): void {
        super.completeTreeItem(item);
        item.description = this._description;
    }
}
