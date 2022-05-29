import { ALRange } from "../../../../lib/types/ALRange";
import { AppAwareNode } from "../../AppAwareNode";
import { ContextValues } from "../../ContextValues";
import { GoToDefinitionCommandContext, GoToDefinitionContext } from "../contexts/GoToDefinitionCommandContext";
import { RangeNode } from "./RangeNode";

/**
 * Represents a range object defined as a `from..to` pair under `idRanges` in `app.json`.
 */
export class PhysicalRangeNode extends RangeNode<ALRange> implements GoToDefinitionCommandContext<ALRange> {
    protected _includeLogicalNameInDescription = false;
    protected _includeLogicalNameInLabel = false;

    constructor(parent: AppAwareNode, range: ALRange) {
        super(parent, range);
        this._contextValues.push(ContextValues.gotoDef);
    }

    public get goto(): GoToDefinitionContext<ALRange> {
        return {
            app: this.app,
            file: "manifest",
            type: "range",
            range: this._range,
        };
    }
}
