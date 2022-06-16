import { commands, TreeItemCollapsibleState } from "vscode";
import { CodeCommand } from "../../commands/commands";
import { Telemetry, TelemetryEventType } from "../../lib/Telemetry";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { Node } from "./Node";

export class ExpandCollapseController {
    private static _controllers: PropertyBag<ExpandCollapseController> = {};

    public static getController(id: string): ExpandCollapseController | undefined {
        return this._controllers[id];
    }

    private readonly _id: string;
    private readonly _refresh: (() => void) | undefined;
    private _iteration = 0;
    private _expandAll: boolean = false;
    private _collapseAll: boolean = false;
    private _wasCollapseAll: boolean = false;
    private _treeState: WeakMap<Node, TreeItemCollapsibleState | undefined> = new WeakMap();

    private setHasExpanded(value: boolean) {
        commands.executeCommand(CodeCommand.SetContext, `${this._id}.hasExpanded`, value);
    }

    private setHasCollapsed(value: boolean) {
        commands.executeCommand(CodeCommand.SetContext, `${this._id}.hasCollapsed`, value);
    }

    public reset() {
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

    public expandAll() {
        this._treeState = new WeakMap<Node, TreeItemCollapsibleState>();

        this.setHasExpanded(true);
        this.setHasCollapsed(false);

        this._iteration++;
        this._expandAll = true;
        this._collapseAll = false;
        this._wasCollapseAll = false;

        this._refresh && this._refresh();
    }

    public collapseAll() {
        this._treeState = new WeakMap<Node, TreeItemCollapsibleState>();

        this.setHasExpanded(false);
        this.setHasCollapsed(true);

        this._iteration++;
        this._expandAll = false;
        this._collapseAll = true;
        this._wasCollapseAll = true;

        this._refresh && this._refresh();
    }

    public expand(node: Node) {
        Telemetry.instance.log(TelemetryEventType.TreeView, undefined, { action: "expand", id: this._id });
        this._treeState.set(node, TreeItemCollapsibleState.Expanded);
        this.setHasExpanded(true);
        this.reset();
    }

    public collapse(node: Node) {
        Telemetry.instance.log(TelemetryEventType.TreeView, undefined, { action: "collapse", id: this._id });
        this._treeState.set(node, TreeItemCollapsibleState.Collapsed);
        this.setHasCollapsed(true);
        this.reset();
    }

    public getState(node: Node, defaultState: TreeItemCollapsibleState): TreeItemCollapsibleState | undefined {
        if (this._expandAll) {
            return TreeItemCollapsibleState.Expanded;
        }
        if (this._collapseAll) {
            return TreeItemCollapsibleState.Collapsed;
        }

        if (!this._treeState.has(node)) {
            if (this._wasCollapseAll) {
                this._treeState.set(node, TreeItemCollapsibleState.Collapsed);
                return TreeItemCollapsibleState.Collapsed;
            } else {
                return defaultState;
            }
        }

        return this._treeState.get(node);
    }

    public get iteration(): number {
        return this._iteration;
    }

    public iterate(): void {
        this._iteration++;
    }
}
