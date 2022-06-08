import { ALRange } from "../../../../lib/types/ALRange";
import { AppPoolAwareNode } from "./AppPoolAwareNode";
import { RangeNode } from "./RangeNode";

/**
 * Represents a range object defined as a `from..to` pair under `idRanges` in `app.json`.
 */
export class PhysicalRangeNode extends RangeNode<ALRange> {
    protected _includeLogicalNameInDescription = false;
    protected _includeLogicalNameInLabel = false;

    constructor(parent: AppPoolAwareNode, range: ALRange) {
        super(parent, range);
    }
}
