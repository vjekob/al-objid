import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { AppPoolAwareNode } from "./AppPoolAwareNode";
import { RangeNode } from "./RangeNode";

/**
 * Represents a logical range object defined as a `from..to` pair under `idRanges` in `.objidconfig` when there are
 * multiple `from..to` pairs all sharing the same logical name (`description`).
 *
 * This node is always shown as a child of {@link LogicalRangeGroupNode}
 */
export class LogicalRangeUnnamedNode extends RangeNode<NinjaALRange> {
    protected _includeLogicalNameInDescription = false;
    protected _includeLogicalNameInLabel = false;

    constructor(parent: AppPoolAwareNode, range: NinjaALRange) {
        super(parent, range);
    }
}
