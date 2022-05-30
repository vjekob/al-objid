import { TreeItemCollapsibleState } from "vscode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { AppAwareNode, AppAwareDescendantNode } from "../../AppAwareNode";
import { ContextValues } from "../../ContextValues";
import { Node } from "../../Node";
import {
    GoToDefinitionCommandContext,
    GoToDefinitionContext,
    GoToDefinitionFile,
    GoToDefinitionType,
} from "../../../../commands/contexts/GoToDefinitionCommandContext";
import { LogicalObjectTypeNode } from "./LogicalObjectTypeNode";

/**
 * Represents a node that groups logical ranges for an individual object type. It contains child nodes where each
 * node represents an object type specified under `objectTypes` property of `.objidconfig`.
 */
export class ObjectRangesGroupNode
    extends AppAwareDescendantNode
    implements GoToDefinitionCommandContext<NinjaALRange>
{
    protected override _iconPath = NinjaIcon["object-ranges"];
    protected override _uriPathPart = "objectranges";
    protected override readonly _label = "Object Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = ".objidconfig";
    protected override readonly _tooltip = "Logical ranges for object types, defined in .objidconfig";

    constructor(parent: AppAwareNode) {
        super(parent);
        this._contextValues.push(ContextValues.GotoDef);
    }

    protected override getChildren(): Node[] {
        return this.app.config.objectTypesSpecified.map(objectType => new LogicalObjectTypeNode(this, objectType));
    }

    public get goto(): GoToDefinitionContext<NinjaALRange> {
        return {
            app: this.app,
            file: GoToDefinitionFile.Configuration,
            type: GoToDefinitionType.ObjectRanges,
        };
    }
}
