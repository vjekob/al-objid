import { commands, TreeItemCollapsibleState } from "vscode";
import { PropertyBag } from "../../lib/types/PropertyBag";

export class ExpandCollapseController {
    private readonly _id: string;
    private _expandAll: boolean = false;
    private _collapseAll: boolean = false;
    private _refresh: (() => void) | undefined;
    private _treeState: PropertyBag<TreeItemCollapsibleState> = {};

    private setHasExpanded(value: boolean) {
        commands.executeCommand("setContext", `${this._id}.hasExpanded`, value);
    }

    private setHasCollapsed(value: boolean) {
        commands.executeCommand("setContext", `${this._id}.hasCollapsed`, value);
    }

    public constructor(id: string) {
        this._id = id;
        this.setHasExpanded(true);
        this.setHasCollapsed(true);
    }

    public setRefresh(refresh: () => void) {
        this._refresh = refresh;
    }

    public get isExpandAll() {
        return this._expandAll;
    }

    public get isCollapseAll() {
        return this._collapseAll;
    }

    public expandAll() {
        this._treeState = {};

        this.setHasExpanded(true);
        this.setHasCollapsed(false);

        this._expandAll = true;
        this._collapseAll = false;

        this._refresh && this._refresh();
    }

    public collapseAll() {
        this._treeState = {};

        this.setHasExpanded(false);
        this.setHasCollapsed(true);

        this._expandAll = false;
        this._collapseAll = true;

        this._refresh && this._refresh();
    }

    public reset() {
        this._expandAll = false;
        this._collapseAll = false;
    }

    public expand(id: string) {
        if (!id) {
            return;
        }
        this._treeState[id] = TreeItemCollapsibleState.Expanded;
    }

    public collapse(id: string) {
        if (!id) {
            return;
        }
        this._treeState[id] = TreeItemCollapsibleState.Collapsed;
    }

    public getState(id: string): TreeItemCollapsibleState | undefined {
        if (this.isExpandAll) {
            return TreeItemCollapsibleState.Expanded;
        }
        if (this.isCollapseAll) {
            return TreeItemCollapsibleState.Collapsed;
        }

        if (!id) {
            return;
        }
        return this._treeState[id];
    }
}
