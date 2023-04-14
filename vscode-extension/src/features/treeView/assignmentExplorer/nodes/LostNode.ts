import { TreeItemLabel, TreeItemCollapsibleState } from "vscode";
import { getSingleIconPath } from "../../../../lib/NinjaIcon";
import { AppAwareDescendantNode, AppAwareNode } from "../../AppAwareNode";
import { DecorationSeverity } from "../../DecorationSeverity";
import { AssignedALObject } from "../../../../lib/types/AssignedALObject";
import { ContextValues } from "../../ContextValues";
import { AssignmentIdContext } from "../../../../commands/contexts/AssignmentContext";
import { ALObjectType } from "../../../../lib/types/ALObjectType";

/**
 * Represents a lost object node defined as an object ID that was previously assigned by Ninja, but is no longer in use.
 */
export class LostNode extends AppAwareDescendantNode implements AssignmentIdContext {
    private readonly _object: AssignedALObject;
    protected override readonly _iconPath = getSingleIconPath("al-lost");
    protected _uriPathPart: string;
    protected _label: string | TreeItemLabel;
    protected _collapsibleState = TreeItemCollapsibleState.None;
    protected _includeLogicalNameInDescription = false;
    protected _includeLogicalNameInLabel = false;

    constructor(parent: AppAwareNode, object: AssignedALObject) {
        super(parent);
        this._object = object;
        this._uriPathPart = object.id.toString();
        this._label = object.id.toString();
        this._description = "";
        this._tooltip = `${object.id} is no longer in use by any ${object.type} object.`;
        this._decoration = {
            severity: DecorationSeverity.inactive,
        };
        this._contextValues.push(ContextValues.ReclaimId);
    }

    public get objectType(): ALObjectType {
        return this._object.type;
    }

    public get objectId(): number {
        return this._object.id;
    }
}
