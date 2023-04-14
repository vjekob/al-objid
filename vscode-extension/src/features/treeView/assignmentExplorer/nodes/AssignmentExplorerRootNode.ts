import { Disposable } from "vscode";
import { ALApp } from "../../../../lib/ALApp";
import { AppAwareNode } from "../../AppAwareNode";
import { ContextValues } from "../../ContextValues";
import { Node } from "../../Node";
import { RootNode } from "../../RootNode";
import { ViewController } from "../../ViewController";
import { CollisionsGroupNode } from "./CollisionsGroupNode";
import { AssignedALObject } from "../../../../lib/types/AssignedALObject";
import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { LostGroupNode } from "./LostGroupNode";

/**
 * Represents a root node for assignment explorer.
 */
export class AssignmentExplorerRootNode extends RootNode implements AppAwareNode, Disposable {
    protected readonly _app: ALApp;
    private readonly _hasLogical: boolean;
    private readonly _hasObject: boolean;
    private readonly _subscription: Disposable;
    protected override readonly _uriAuthority: string;
    protected override readonly _label: string;
    protected override readonly _description: string;
    protected override readonly _tooltip: string;
    private _assigned: AssignedALObject[] = [];
    private _unassigned: ALObject[] = [];

    constructor(app: ALApp, view: ViewController) {
        super(view);

        this._app = app;
        this._label = app.name || app.manifest.name;
        this._description = app.manifest.version;
        this._tooltip = `${app.manifest.name} v${app.manifest.version}`;
        this._uriAuthority = app.hash;
        this._contextValues.push(ContextValues.Sync);

        this._hasLogical = this._app.config.idRanges.length > 0;
        this._hasObject = this._app.config.objectTypesSpecified.length > 0;

        this._contextValues.push(ContextValues.Sync);
        if (!this._hasLogical && !this._hasObject) {
            this._contextValues.push(ContextValues.CopyRanges);
        }

        this._subscription = app.assignmentMonitor.onAssignmentChanged(({ assigned, unassigned }) => {
            this._assigned = assigned;
            this._unassigned = unassigned;
            this._view.update(this);
        });

        this._assigned = app.assignmentMonitor.assigned;
        this._unassigned = app.assignmentMonitor.unassigned;
    }

    protected override getChildren(): Node[] {
        let children: Node[] = [];

        children.push(new CollisionsGroupNode(this, this._unassigned));
        children.push(new LostGroupNode(this, this._assigned));
        return children;
    }

    public get app() {
        return this._app;
    }

    public get appId() {
        return this.app.hash;
    }

    public dispose(): void {
        this._subscription.dispose();
    }
}
