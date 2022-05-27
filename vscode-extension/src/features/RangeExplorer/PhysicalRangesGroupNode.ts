import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { AppAwareNode, AppAwareDescendantNode } from "../Explorer/AppAwareNode";

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
}
