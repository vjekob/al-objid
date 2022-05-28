import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { AppAwareNode, AppAwareDescendantNode } from "../AppAwareNode";
import { Node } from "../Node";
import { PhysicalRangeNode } from "./PhysicalRangeNode";

export class PhysicalRangesGroupNode extends AppAwareDescendantNode {
    protected override _iconPath = new ThemeIcon("array");
    protected override _uriPathPart = "ranges";
    protected override readonly _label = "Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = "app.json";
    protected override readonly _tooltip = "Physical ranges defined in app.json";

    constructor(parent: AppAwareNode) {
        super(parent);
    }

    protected override getChildren(): Node[] {
        const ranges = this.app.manifest.idRanges;
        return ranges.map(range => new PhysicalRangeNode(this.parent, range));
    }
}
