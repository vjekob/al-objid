import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { AppAwareNode, AppAwareDescendantNode } from "../Explorer/AppAwareNode";

export class ObjectRangesGroupNode extends AppAwareDescendantNode {
    protected override _iconPath = new ThemeIcon("group-by-ref-type");
    protected override _uriPathPart = "objectranges";
    protected override readonly _label = "Object Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = ".objidconfig";
    protected override readonly _tooltip = "Logical ranges for object types, defined in .objidconfig";

    constructor(parent: AppAwareNode) {
        super(parent);
    }
}
