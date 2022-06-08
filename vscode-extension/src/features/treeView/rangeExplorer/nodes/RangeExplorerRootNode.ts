import { Disposable } from "vscode";
import { AppCommandContext } from "../../../../commands/contexts/AppCommandContext";
import { ALApp } from "../../../../lib/ALApp";
import { ConsumptionCache } from "../../../ConsumptionCache";
import { AppAwareNode } from "../../AppAwareNode";
import { ContextValues } from "../../ContextValues";
import { Node } from "../../Node";
import { RootNode } from "../../RootNode";
import { ViewController } from "../../ViewController";
import { LogicalRangesGroupNode } from "./LogicalRangesGroupNode";
import { ObjectRangesGroupNode } from "./ObjectRangesGroupNode";
import { PhysicalRangeNode } from "./PhysicalRangeNode";
import { PhysicalRangesGroupNode } from "./PhysicalRangesGroupNode";

/**
 * Represents a root node for range explorer.
 */
export class RangeExplorerRootNode extends RootNode implements AppAwareNode, AppCommandContext, Disposable {
    protected readonly _app: ALApp;
    private readonly _hasLogical: boolean;
    private readonly _hasObject: boolean;
    private readonly _subscription: Disposable;
    protected override readonly _uriAuthority: string;
    protected override readonly _label: string;
    protected override readonly _description: string;
    protected override readonly _tooltip: string;

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

        this._subscription = ConsumptionCache.instance.onConsumptionUpdate(app.hash, () => {
            this._view.update(this);
        });
    }

    protected override getChildren(): Node[] {
        let children: Node[] = [];

        if (!this._hasLogical && !this._hasObject) {
            children = this._app.manifest.idRanges.map(range => new PhysicalRangeNode(this, range));
        } else {
            children = [new PhysicalRangesGroupNode(this)];
        }

        if (this._hasLogical) {
            children!.push(new LogicalRangesGroupNode(this));
        }
        if (this._hasObject) {
            children!.push(new ObjectRangesGroupNode(this));
        }

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
