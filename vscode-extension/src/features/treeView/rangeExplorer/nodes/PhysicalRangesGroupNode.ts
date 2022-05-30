import { TreeItemCollapsibleState } from "vscode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { ALRange } from "../../../../lib/types/ALRange";
import { AppAwareNode, AppAwareDescendantNode } from "../../AppAwareNode";
import { ContextValues } from "../../ContextValues";
import { Node } from "../../Node";
import {
    GoToDefinitionCommandContext,
    GoToDefinitionContext,
    GoToDefinitionFile,
    GoToDefinitionType,
} from "../../../../commands/contexts/GoToDefinitionCommandContext";
import { PhysicalRangeNode } from "./PhysicalRangeNode";
import { AppCommandContext } from "../../../../commands/contexts/AppCommandContext";

/**
 * Displays a node that shows "Ranges" label under which all physical ranges defined in `app.json` will be shown.
 *
 * Contains children of {@link PhysicalRangeNode} type.
 */
export class PhysicalRangesGroupNode
    extends AppAwareDescendantNode
    implements GoToDefinitionCommandContext<ALRange>, AppCommandContext
{
    protected override _iconPath = NinjaIcon["physical-range"];
    protected override _uriPathPart = "ranges";
    protected override readonly _label = "Ranges";
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected override readonly _description = "app.json";
    protected override readonly _tooltip = "Physical ranges defined in app.json";

    constructor(parent: AppAwareNode) {
        super(parent);
        this._contextValues.push(ContextValues.GotoDef, ContextValues.CopyRanges);
    }

    protected override getChildren(): Node[] {
        const ranges = this.app.manifest.idRanges;
        return ranges.map(range => new PhysicalRangeNode(this.parent, range));
    }

    public get goto(): GoToDefinitionContext<ALRange> {
        return {
            app: this.app,
            file: GoToDefinitionFile.Manifest,
            type: GoToDefinitionType.IdRanges,
        };
    }
}
