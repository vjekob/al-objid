import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { __obsolete_INinjaTreeItem_ } from "./__obsolete_NinjaTreeItem_";

export class TextTreeItem implements __obsolete_INinjaTreeItem_ {
    private readonly _text: string;
    private readonly _tooltip: string;
    private readonly _id: string;

    constructor(text: string, tooltip: string, parent: __obsolete_INinjaTreeItem_ | undefined) {
        this.parent = parent;
        this._text = text;
        this._tooltip = tooltip;
        this._id = `${parent?.id || ""}.[${text}]`;
    }

    public readonly parent: __obsolete_INinjaTreeItem_ | undefined;

    public children = [];

    public getTreeItem() {
        const item = new TreeItem(this._text, TreeItemCollapsibleState.None);
        item.tooltip = this._tooltip;
        return item;
    }

    public get id() {
        return this._id;
    }
}
