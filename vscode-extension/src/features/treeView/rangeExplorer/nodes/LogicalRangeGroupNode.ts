import { ThemeIcon, TreeItemLabel, TreeItemCollapsibleState } from "vscode";
import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { AppAwareDescendantNode, AppAwareNode } from "../../AppAwareNode";
import { ContextValues } from "../../ContextValues";
import { Node } from "../../Node";
import {
    GoToDefinitionCommandContext,
    GoToDefinitionContext,
    GoToDefinitionFile,
    GoToDefinitionType,
} from "../../../../commands/contexts/GoToDefinitionCommandContext";
import { LogicalRangeUnnamedNode } from "./LogicalRangeUnnamedNode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";

/**
 * Represents such logical range where there are multiple `from..to` pairs that share the same logical name
 * (`description`).
 *
 * This node always contains children of type {@link LogicalRangeUnnamedNode}.
 */
export class LogicalRangeGroupNode
    extends AppAwareDescendantNode
    implements GoToDefinitionCommandContext<NinjaALRange>
{
    private readonly _name: string;
    private readonly _ranges: NinjaALRange[];
    protected readonly _iconPath = NinjaIcon.note;
    protected readonly _uriPathPart: string;
    protected readonly _label: string | TreeItemLabel;
    protected _collapsibleState = TreeItemCollapsibleState.Expanded;

    constructor(parent: AppAwareNode, name: string, ranges: NinjaALRange[]) {
        super(parent);

        this._name = name;
        this._ranges = ranges;
        this._label = name;
        this._uriPathPart = name || "_";

        this._contextValues.push(ContextValues.GotoDef);
    }

    protected override getChildren(): Node[] {
        const nameLower = (this._name || "").toLowerCase().trim();
        const ranges = this._ranges.filter(range => (range.description || "").toLowerCase().trim() === nameLower);
        return ranges.map(range => new LogicalRangeUnnamedNode(this, range));
    }

    public get goto(): GoToDefinitionContext<NinjaALRange> {
        return {
            app: this.app,
            file: GoToDefinitionFile.Configuration,
            type: GoToDefinitionType.LogicalName,
            logicalName: this._name,
        };
    }
}
