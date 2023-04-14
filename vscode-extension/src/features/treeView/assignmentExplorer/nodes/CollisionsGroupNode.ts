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
import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { ALObjectType } from "../../../../lib/types/ALObjectType";
import { CollisionObjectTypeNode } from "./CollisionObjectTypeNode";

/**
 * Displays a node that shows "Conflicts" label under which either object types that have conflicts, or no conflicts nodes are shown.
 *
 * Contains children of {@link CollisionObjectTypeNode} type.
 */
export class CollisionsGroupNode extends AppAwareDescendantNode {
    private readonly _unassigned: ALObject[];
    protected override _iconPath = NinjaIcon["al-collision"];
    protected override _uriPathPart = "collisions";
    protected override _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override _description = "Manually assigned";
    protected override _label = "Conflicts";
    protected override _tooltip: string | MarkdownString = new MarkdownString(
        "Object IDs that were **manually assigned** and are **not stored** in the back end.\n\nYou should avoid manually assigning object IDs as they are not stored in the back end and can be overwritten by other developers.\n\n[Learn more...](https://github.com/vjekob/al-objid/wiki/Does-everyone-on-my-team-need-to-use-Ninja%3F)"
    );

    constructor(parent: AppAwareNode, unassigned: ALObject[]) {
        super(parent);
        this._unassigned = unassigned;

        if (this._unassigned.length === 0) {
            this._collapsibleState = TreeItemCollapsibleState.None;
            this._iconPath = NinjaIcon["check"];
            this._description = "";
            this._label = "No manually assigned object IDs";
            this._tooltip = "All object IDs in this app are assigned using AL Object ID Ninja.";
        }
    }

    protected override getChildren(): Node[] {
        const children: Node[] = [];

        for (let key of Object.values<string>(ALObjectType)) {
            const objectsOfType = this._unassigned.filter(obj => obj.type === key);
            if (objectsOfType.length === 0) {
                continue;
            }
            children.push(new CollisionObjectTypeNode(this, key as ALObjectType, objectsOfType));
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
