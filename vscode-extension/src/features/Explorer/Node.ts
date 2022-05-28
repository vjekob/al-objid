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
    protected _children: Node[] | Promise<Node[]> | undefined;

    protected completeTreeItem(item: TreeItem) {
        // Override in descending classes to add more properties to the tree item
    }

    protected getChildren(): Node[] | Promise<Node[]> {
        return [];
    }

    public getTreeItem(): TreeItem {
        const item = new TreeItem(this._label, this._collapsibleState);

        if (this._description) {
            item.description = this._description;
        }

        if (this._tooltip !== undefined) {
            item.tooltip = this._tooltip;
        }

        this.completeTreeItem(item);

        return item;
    }

    public resetChildren(): void {
        this._children = undefined;
    }

    public get children(): Node[] | Promise<Node[]> {
        return this.getChildren();

        // TODO The logic below should be included when smart updating is implemented
        // Smart updating updates only those nodes where something changes

        // if (!this._children) {
        //     this._children = this.getChildren();
        // }

        // return this._children;
    }

    public id: string | undefined;
}
