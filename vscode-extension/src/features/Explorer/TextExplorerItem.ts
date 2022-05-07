import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { NinjaExplorerItem } from "./NinjaExplorerItem";

export class TextExplorerItem implements NinjaExplorerItem {
    private readonly _text: string;
    private readonly _tooltip: string;

    constructor(text: string, tooltip: string, parent: NinjaExplorerItem | undefined) {
        this.parent = parent;
        this._text = text;
        this._tooltip = tooltip;
    }

    public readonly parent: NinjaExplorerItem | undefined;

    public children = [];

    public getTreeItem() {
        const item = new TreeItem(this._text, TreeItemCollapsibleState.None);
        item.tooltip = this._tooltip;
        return item;
    }
}
