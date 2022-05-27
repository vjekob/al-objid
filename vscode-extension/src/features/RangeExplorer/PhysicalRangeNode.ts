import { TreeItemCollapsibleState } from "vscode";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { AppAwareNode } from "../Explorer/AppAwareNode";
import { RangeNode } from "./RangeNode";

export class PhysicalRangeNode extends RangeNode {
    protected _includeLogicalNameInDescription = false;
    protected _includeLogicalNameInLabel = false;
    protected readonly _collapsibleState: TreeItemCollapsibleState;

    constructor(parent: AppAwareNode, range: NinjaALRange) {
        super(parent, range);
        this._collapsibleState = TreeItemCollapsibleState.Expanded;
    }
}
