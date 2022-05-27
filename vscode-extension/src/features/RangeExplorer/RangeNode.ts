import { ThemeIcon, TreeItem } from "vscode";
import { ALRange } from "../../lib/types/ALRange";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { AppAwareNode, AppAwareDescendantNode } from "../Explorer/AppAwareNode";

export abstract class RangeNode extends AppAwareDescendantNode {
    private readonly _range: ALRange;
    protected override readonly _label: string;
    protected override readonly _iconPath = new ThemeIcon("arrow-both");
    protected override readonly _uriPathPart: string;

    protected abstract _includeLogicalNameInDescription: boolean;
    protected abstract _includeLogicalNameInLabel: boolean;

    constructor(parent: AppAwareNode, range: ALRange) {
        super(parent);
        this._range = range;
        this._label = `${range.from}..${range.to}`;
        this._tooltip = `From ${range.from} to ${range.to}`;
        this._uriPathPart = `${range.from}-${range.to}`;
    }

    protected override completeTreeItem(item: TreeItem): void {
        super.completeTreeItem(item);

        const ninjaRange = this._range as NinjaALRange;
        if (ninjaRange && ninjaRange.description) {
            if (this._includeLogicalNameInDescription) {
                item.description = ninjaRange.description;
            }
            if (this._includeLogicalNameInLabel) {
                item.label = `${item.label} (${ninjaRange.description})`;
            }
        }
    }
}
