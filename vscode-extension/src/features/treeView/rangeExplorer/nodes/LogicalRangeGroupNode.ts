import { ThemeIcon, TreeItemLabel, TreeItemCollapsibleState } from "vscode";
import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { AppAwareDescendantNode, AppAwareNode } from "../../AppAwareNode";
import { Node } from "../../Node";
import { LogicalRangeUnnamedNode } from "./LogicalRangeUnnamedNode";

/**
 * Represents such logical range where there are multiple `from..to` pairs that share the same logical name
 * (`description`).
 *
 * This node always contains children of type {@link LogicalRangeUnnamedNode}.
 */
export class LogicalRangeGroupNode extends AppAwareDescendantNode {
    private readonly _name: string;
    private readonly _ranges: NinjaALRange[];
    protected readonly _iconPath = new ThemeIcon("bookmark");
    protected readonly _uriPathPart: string;
    protected readonly _label: string | TreeItemLabel;
    protected _collapsibleState = TreeItemCollapsibleState.Expanded;

    constructor(parent: AppAwareNode, name: string, ranges: NinjaALRange[]) {
        super(parent);

        this._name = name;
        this._ranges = ranges;
        this._label = name;
        this._uriPathPart = name || "_";
    }

    protected override getChildren(): Node[] {
        const nameLower = (this._name || "").toLowerCase().trim();
        const ranges = this._ranges.filter(range => (range.description || "").toLowerCase().trim() === nameLower);
        return ranges.map(range => new LogicalRangeUnnamedNode(this, range));
    }
}
