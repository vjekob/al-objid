import { TreeItem, TreeItemCollapsibleState, TreeItemLabel, Uri } from "vscode";

export abstract class Node {
    constructor(parent: Node | undefined) {
        this._parent = parent;
    }

    protected abstract _label: string | TreeItemLabel;
    protected abstract _collapsibleState: TreeItemCollapsibleState;
    protected _parent: Node | undefined;
    protected _description: string | undefined;
    protected _tooltip: string | undefined;
    protected _children: Node[] = [];

    protected completeTreeItem(item: TreeItem) {
        // Override in descending classes to add more properties to the tree item
    }

    public getTreeItem(): TreeItem {
        const item = new TreeItem(this._label, this._collapsibleState || TreeItemCollapsibleState.Expanded);

        if (this._description) {
            item.description = this._description;
        }

        if (this._tooltip !== undefined) {
            item.tooltip = this._tooltip;
        }

        this.completeTreeItem(item);

        return item;
    }

    public getChildren(): Node[] | Promise<Node[]> {
        return this._children;
    }

    public id: string | undefined;
}
