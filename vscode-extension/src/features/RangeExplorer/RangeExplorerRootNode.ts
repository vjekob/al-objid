import { Node } from "../Explorer/Node";
import { RootNode } from "../Explorer/RootNode";
import { LogicalRangesGroupNode } from "./LogicalRangesGroupNode";
import { ObjectTypeRangesGroupNode } from "./ObjectTypeRangesGroupNode";
import { PhysicalRangeNode } from "./PhysicalRangeNode";
import { PhysicalRangesGroupNode } from "./PhysicalRangesGroupNode";

/**
 * Represents a root node for range explorer.
 */
export class RangeExplorerRootNode extends RootNode {
    protected override getChildren(): Node[] {
        const hasLogical = this._app.config.idRanges.length > 0;
        const hasObject = this._app.config.objectTypesSpecified.length > 0;

        let children: Node[] = [];

        if (!hasLogical && !hasObject) {
            children = this._app.manifest.idRanges.map(range => new PhysicalRangeNode(this, range));
        } else {
            children = [new PhysicalRangesGroupNode(this)];
        }

        if (hasLogical) {
            children!.push(new LogicalRangesGroupNode(this));
        }
        if (hasObject) {
            children!.push(new ObjectTypeRangesGroupNode(this));
        }

        return children;
    }
}
