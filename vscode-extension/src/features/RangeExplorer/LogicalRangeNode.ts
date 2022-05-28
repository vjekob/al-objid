import { RangeNode } from "./RangeNode";

export class LogicalRangeNode extends RangeNode {
    protected readonly _includeLogicalNameInDescription = true;
    protected readonly _includeLogicalNameInLabel = false;
}
