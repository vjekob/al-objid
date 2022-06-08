import { TreeItemCollapsibleState } from "vscode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { Node } from "../../Node";
import { PhysicalRangeNode } from "./PhysicalRangeNode";
import { AppPoolAwareDescendantNode, AppPoolAwareNode } from "./AppPoolAwareNode";

/**
 * Displays a node that shows "Ranges" label under which all physical ranges defined in `app.json` will be shown.
 *
 * Contains children of {@link PhysicalRangeNode} type.
 */
export class PhysicalRangesGroupNode extends AppPoolAwareDescendantNode {
    protected override _iconPath = NinjaIcon["physical-range"];
    protected override _uriPathPart = "ranges";
    protected override readonly _label = "Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = "app.json";
    protected override readonly _tooltip = "Physical ranges defined in app.json";

    constructor(parent: AppPoolAwareNode) {
        super(parent);
    }

    protected override getChildren(): Node[] {
        const ranges = this.rootNode.physicalRanges;
        return ranges.map(range => new PhysicalRangeNode(this.parent, range));
    }
}
