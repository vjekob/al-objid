import { Node } from "../Explorer/Node";
import { RootNode } from "../Explorer/RootNode";
import { LogicalRangesGroupNode } from "./LogicalRangesGroupNode";
import { ObjectRangesGroupNode } from "./ObjectRangesGroupNode";
import { PhysicalRangeNode } from "./PhysicalRangeNode";
import { PhysicalRangesGroupNode } from "./PhysicalRangesGroupNode";

export class RangeExplorerRootNode extends RootNode {
    public override getChildren(): Node[] {
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
            children!.push(new ObjectRangesGroupNode(this));
        }

        return children;
    }
}
