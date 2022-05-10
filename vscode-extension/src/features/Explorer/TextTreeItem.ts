import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { INinjaTreeItem } from "./NinjaTreeItem";

export class TextTreeItem implements INinjaTreeItem {
    private readonly _text: string;
    private readonly _tooltip: string;

    constructor(text: string, tooltip: string, parent: INinjaTreeItem | undefined) {
        this.parent = parent;
        this._text = text;
        this._tooltip = tooltip;
    }

    public readonly parent: INinjaTreeItem | undefined;

    public children = [];

    public getTreeItem() {
        const item = new TreeItem(this._text, TreeItemCollapsibleState.None);
        item.tooltip = this._tooltip;
        return item;
    }
}
