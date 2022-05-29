import { ALRange } from "../../../lib/types/ALRange";
import {
    GoToDefinitionCommandContext,
    GoToDefinitionFile,
    GoToDefinitionType,
} from "./commandContexts/GoToDefinitionCommandContext";
import { RangeNode } from "./RangeNode";

export class PhysicalRangeNode extends RangeNode implements GoToDefinitionCommandContext {
    protected _includeLogicalNameInDescription = false;
    protected _includeLogicalNameInLabel = false;

    public get file(): GoToDefinitionFile {
        return "manifest";
    }

    public get type(): GoToDefinitionType {
        return "range";
    }

    public get range(): ALRange {
        return this._range;
    }
}
