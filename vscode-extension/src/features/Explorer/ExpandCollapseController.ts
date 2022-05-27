import { commands, TreeItemCollapsibleState } from "vscode";
import { CodeCommand } from "../../commands/commands";
import { PropertyBag } from "../../lib/types/PropertyBag";

export class ExpandCollapseController {
    private static _controllers: PropertyBag<ExpandCollapseController> = {};

    public static getController(id: string): ExpandCollapseController | undefined {
        return this._controllers[id];
    }

    private readonly _id: string;
    private readonly _refresh: (() => void) | undefined;
    private _expandAll: boolean = false;
    private _collapseAll: boolean = false;
    private _treeState: PropertyBag<TreeItemCollapsibleState> = {};

    private setHasExpanded(value: boolean) {
        commands.executeCommand(CodeCommand.SetContext, `${this._id}.hasExpanded`, value);
    }

    private setHasCollapsed(value: boolean) {
        commands.executeCommand(CodeCommand.SetContext, `${this._id}.hasCollapsed`, value);
    }

    private reset() {
        this._expandAll = false;
        this._collapseAll = false;
    }

    public constructor(id: string, refresh: () => void) {
        this._id = id;
        this._refresh = refresh;
        this.setHasExpanded(true);
        this.setHasCollapsed(true);
        ExpandCollapseController._controllers[id] = this;
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

    public expand(id: string) {
        if (!id) {
            return;
        }
        this._treeState[id] = TreeItemCollapsibleState.Expanded;
        this.setHasExpanded(true);
        this.reset();
    }

    public collapse(id: string) {
        if (!id) {
            return;
        }
        this._treeState[id] = TreeItemCollapsibleState.Collapsed;
        this.setHasCollapsed(true);
        this.reset();
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
