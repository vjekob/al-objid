import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { AppAwareNode, AppAwareDescendantNode } from "../AppAwareNode";
import { Node } from "../Node";
import { LogicalRangeGroupNode } from "./LogicalRangeGroupNode";
import { LogicalRangeNode } from "./LogicalRangeNode";

/**
 * Represents a node that displays "Logical Ranges" label and contains the list of logical ranges, either as list of
 * names (when one logical range contains multiple sub-ranges), or as list of ranges with name included in description.
 */
export class LogicalRangesGroupNode extends AppAwareDescendantNode {
    protected override _iconPath = new ThemeIcon("symbol-namespace");
    protected override _uriPathPart = "logicalranges";
    protected override readonly _label = "Logical Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = ".objidconfig";
    protected override readonly _tooltip = "Logical ranges defined in .objidconfig";

    constructor(parent: AppAwareNode) {
        super(parent);
    }

    protected override getChildren(): Node[] {
        const logicalRangeNames = this.app.config.logicalRangeNames;
        const logicalRanges = this.app.config.idRanges;

        const children = logicalRangeNames.map(name => {
            const compareName = (name || "").toLowerCase().trim();
            const ranges = logicalRanges.filter(
                range => (range.description || "").toLowerCase().trim() === compareName
            );
            return ranges.length === 1
                ? new LogicalRangeNode(this, ranges[0])
                : new LogicalRangeGroupNode(this, name, logicalRanges);
        });

        return children;
    }
}
