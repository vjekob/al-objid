import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { AppAwareNode, AppAwareDescendantNode } from "../Explorer/AppAwareNode";

export class LogicalRangesGroupNode extends AppAwareDescendantNode {
    protected override _iconPath = new ThemeIcon("tag");
    protected override _uriPathPart = "logicalranges";
    protected override readonly _label = "Logical Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = ".objidconfig";
    protected override readonly _tooltip = "Logical ranges defined in .objidconfig";

    constructor(parent: AppAwareNode) {
        super(parent);
    }
}
