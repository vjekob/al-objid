import { AppAwareDescendantNode, AppAwareNode } from "../Explorer/AppAwareNode";

export abstract class ObjectTypeNode extends AppAwareDescendantNode {
    protected readonly _objectType: string;
    protected override readonly _label: string;
    protected override _uriPathPart: string;

    constructor(parent: AppAwareNode, objectType: string) {
        super(parent);
        this._objectType = objectType;
        this._label = objectType;
        this._uriPathPart = objectType;
    }
}
