import { ThemeIcon, TreeItem } from "vscode";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { AppAwareDescendantNode, AppAwareNode } from "../Explorer/AppAwareNode";
import { DecorableDescendantNode } from "../Explorer/DecorableNode";
import { Node } from "../Explorer/Node";

export abstract class RangeNode extends DecorableDescendantNode implements AppAwareDescendantNode {
    private readonly _range: NinjaALRange;
    protected override readonly _label: string;
    protected override readonly _iconPath = new ThemeIcon("arrow-both");
    protected override readonly _uriAuthority: string;
    protected override readonly _uriPathPart: string;

    protected abstract _includeLogicalNameInDescription: boolean;
    protected abstract _includeLogicalNameInLabel: boolean;

    constructor(parent: AppAwareNode, range: NinjaALRange) {
        super(parent);
        this._range = range;
        this._label = `${range.from}..${range.to}`;
        this._tooltip = `From ${range.from} to ${range.to}`;
        this._uriAuthority = parent.app.hash;
        this._uriPathPart = `${range.from}-${range.to}`;
    }

    protected override completeTreeItem(item: TreeItem): void {
        super.completeTreeItem(item);

        if (this._includeLogicalNameInDescription) {
            item.description = this._range.description;
        }
        if (this._includeLogicalNameInLabel) {
            item.label = `${item.label} (${this._range.description})`;
        }
    }

    public get app() {
        return this.parent.app;
    }

    public get parent() {
        return this._parent as AppAwareNode;
    }
}
