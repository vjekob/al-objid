import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { NinjaExplorerItem } from "./ExplorerItem";

export class TextExplorerItem implements NinjaExplorerItem {
    private readonly _text: string;
    private readonly _tooltip: string;

    constructor(text: string, tooltip: string) {
        this._text = text;
        this._tooltip = tooltip;
    }

    public children = [];

    public getTreeItem() {
        const item = new TreeItem(this._text, TreeItemCollapsibleState.None);
        item.tooltip = this._tooltip;
        return item;
    }
}
