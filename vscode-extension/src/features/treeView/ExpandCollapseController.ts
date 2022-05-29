import { commands, TreeItemCollapsibleState } from "vscode";
import { CodeCommand } from "../../commands/commands";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { Node } from "./Node";

export class ExpandCollapseController {
    private static _controllers: PropertyBag<ExpandCollapseController> = {};

    public static getController(id: string): ExpandCollapseController | undefined {
        return this._controllers[id];
    }

    private readonly _id: string;
    private readonly _refresh: (() => void) | undefined;
    private _expandAll: boolean = false;
    private _collapseAll: boolean = false;
    private _treeState = new WeakMap<Node, TreeItemCollapsibleState>();

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
        this._treeState = new WeakMap<Node, TreeItemCollapsibleState>();

        this.setHasExpanded(true);
        this.setHasCollapsed(false);

        this._expandAll = true;
        this._collapseAll = false;

        this._refresh && this._refresh();
    }

    public collapseAll() {
        this._treeState = new WeakMap<Node, TreeItemCollapsibleState>();

        this.setHasExpanded(false);
        this.setHasCollapsed(true);

        this._expandAll = false;
        this._collapseAll = true;

        this._refresh && this._refresh();
    }

    public expand(node: Node) {
        this._treeState.set(node, TreeItemCollapsibleState.Expanded);
        this.setHasExpanded(true);
        this.reset();
    }

    public collapse(node: Node) {
        this._treeState.set(node, TreeItemCollapsibleState.Collapsed);
        this.setHasCollapsed(true);
        this.reset();
    }

    public getState(node: Node): TreeItemCollapsibleState | undefined {
        if (this.isExpandAll) {
            return TreeItemCollapsibleState.Expanded;
        }
        if (this.isCollapseAll) {
            return TreeItemCollapsibleState.Collapsed;
        }

        return this._treeState.get(node);
    }
}