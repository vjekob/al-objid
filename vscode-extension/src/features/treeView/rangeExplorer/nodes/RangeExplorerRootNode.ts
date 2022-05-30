import { Disposable } from "vscode";
import { AppCommandContext } from "../../../../commands/contexts/AppCommandContext";
import { ALApp } from "../../../../lib/ALApp";
import { ConsumptionCache } from "../../../ConsumptionCache";
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
export class RangeExplorerRootNode extends RootNode implements AppCommandContext {
    private readonly _hasLogical: boolean;
    private readonly _hasObject: boolean;
    private readonly _subscription: Disposable;

    constructor(app: ALApp, view: ViewController) {
        super(app, view);

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

    public override dispose(): void {
        this._subscription.dispose();
    }

    public get appId() {
        return this.app.hash;
    }
}
