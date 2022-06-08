import { TreeItemCollapsibleState } from "vscode";
import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { Node } from "../../Node";
import { LogicalRangeGroupNode } from "./LogicalRangeGroupNode";
import { LogicalRangeNamedNode } from "./LogicalRangeNamedNode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { AppPoolAwareDescendantNode, AppPoolAwareNode } from "./AppPoolAwareNode";

/**
 * Displays a node that shows "Logical Ranges" label and contains the list of logical ranges.
 *
 * It contains list of children, one per logical name, where each child is one of these types:
 * - {@link LogicalRangeGroupNode} when multiple ranges (`from..to` pairs) share the same logical name (`description`)
 * - {@link LogicalRangeNamedNode} when only one range (`from..to` pair) has this logical name (`description`)
 */
export class LogicalRangesGroupNode extends AppPoolAwareDescendantNode {
    protected override _iconPath = NinjaIcon["logical-range"];
    protected override _uriPathPart = "logicalranges";
    protected override readonly _label = "Logical Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = ".objidconfig";
    protected override readonly _tooltip = "Logical ranges defined in .objidconfig";

    constructor(parent: AppPoolAwareNode) {
        super(parent);
    }

    protected override getChildren(): Node[] {
        const logicalRangeNames = this.rootNode.logicalRangeNames;
        const logicalRanges = this.rootNode.logicalRanges;

        const children = logicalRangeNames.map(name => {
            const compareName = (name || "").toLowerCase().trim();
            const ranges = logicalRanges.filter(
                range => (range.description || "").toLowerCase().trim() === compareName
            );
            return ranges.length === 1
                ? new LogicalRangeNamedNode(this, ranges[0])
                : new LogicalRangeGroupNode(this, name, logicalRanges);
        });

        return children;
    }
}
