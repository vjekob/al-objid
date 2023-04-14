import { LostObjectTypeNode } from "./LostObjectTypeNode";
import { MarkdownString, TreeItemCollapsibleState } from "vscode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { ALRange } from "../../../../lib/types/ALRange";
import { AppAwareNode, AppAwareDescendantNode } from "../../AppAwareNode";
import { Node } from "../../Node";
import {
    GoToDefinitionContext,
    GoToDefinitionFile,
    GoToDefinitionType,
} from "../../../../commands/contexts/GoToDefinitionCommandContext";
import { ALObjectType } from "../../../../lib/types/ALObjectType";
import { AssignedALObject } from "../../../../lib/types/AssignedALObject";

/**
 * Displays a node that shows "Lost" label under which either object types that have conflicts, or no conflicts nodes are shown.
 *
 * Contains children of {@link LostObjectTypeNode} type.
 */
export class LostGroupNode extends AppAwareDescendantNode {
    private readonly _assigned: AssignedALObject[];
    protected override _iconPath = NinjaIcon["al-lost"];
    protected override _uriPathPart = "lost";
    protected override _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override _description = "Not used by any object";
    protected override _label = "Lost";

    constructor(parent: AppAwareNode, unassigned: AssignedALObject[]) {
        super(parent);
        this._assigned = unassigned;

        if (this._assigned.length === 0) {
            this._collapsibleState = TreeItemCollapsibleState.None;
            this._iconPath = NinjaIcon["check"];
            this._description = "";
            this._label = "No lost object IDs";
            this._tooltip = "All object IDs assigned to this app using AL Object ID Ninja are currently in use";
        } else {
            this._tooltip = new MarkdownString(
                "Object IDs that were assigned by AL Object ID Ninja but are no longer used by any object.\n\nMost likely these objects have been assigned by a developer in the past, but the object file for which they were used has been deleted, or another object ID has been assigned.\n\n**Be careful!** These object IDs may also represent object IDs assigned by other developers in their local branches, that have not yet been pushed and merged to the mainline. Before reclaiming these object IDs, make sure they are not in use by another branch."
            );
        }
    }

    protected override getChildren(): Node[] {
        const children: Node[] = [];

        for (let key of Object.values<string>(ALObjectType)) {
            const objectsOfType = this._assigned.filter(obj => obj.type === key);
            if (objectsOfType.length === 0) {
                continue;
            }
            children.push(new LostObjectTypeNode(this, key as ALObjectType, objectsOfType));
        }

        return children;
    }

    public get goto(): GoToDefinitionContext<ALRange> {
        return {
            app: this.app,
            file: GoToDefinitionFile.Manifest,
            type: GoToDefinitionType.IdRanges,
        };
    }
}
