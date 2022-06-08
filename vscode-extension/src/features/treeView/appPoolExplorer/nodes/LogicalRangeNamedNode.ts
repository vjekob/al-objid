import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { AppPoolAwareNode } from "./AppPoolAwareNode";
import { RangeNode } from "./RangeNode";

/**
 * Represents a logical range defined under `idRanges` in `.objidconfig`.
 *
 * This node is shown when there is only one range (`from..to` pair) with the same logical name ()`description`).
 *
 * This node will show label that includes `from`, `to`, and `description`.
 *
 * This node contains children, one per unique object type represented under consumption from this range.
 */
export class LogicalRangeNamedNode extends RangeNode<NinjaALRange> {
    protected readonly _includeLogicalNameInDescription = true;
    protected readonly _includeLogicalNameInLabel = false;

    constructor(parent: AppPoolAwareNode, range: NinjaALRange) {
        super(parent, range);
    }
}
