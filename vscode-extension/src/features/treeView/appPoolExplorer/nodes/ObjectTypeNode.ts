import { AppPoolAwareDescendantNode, AppPoolAwareNode } from "./AppPoolAwareNode";

/**
 * Abstract node that shows object type label.
 */
export abstract class ObjectTypeNode extends AppPoolAwareDescendantNode {
    protected readonly _objectType: string;
    protected override readonly _label: string;
    protected override _uriPathPart: string;

    constructor(parent: AppPoolAwareNode, objectType: string) {
        super(parent);
        this._objectType = objectType;
        this._label = objectType;
        this._uriPathPart = objectType;
    }
}
