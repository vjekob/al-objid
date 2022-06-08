import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { ALObjectType } from "../../../../lib/types/ALObjectType";
import { ALRange } from "../../../../lib/types/ALRange";
import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { DecorationSeverity } from "../../DecorationSeverity";
import { Node } from "../../Node";
import { AppPoolAwareDescendantNode, AppPoolAwareNode } from "./AppPoolAwareNode";
import { ObjectTypeConsumptionNode } from "./ObjectTypeConsumptionNode";

/**
 * Abstract node that displays range (from..to) as label and typically includes children that represent
 * consumption per object type.
 */
export abstract class RangeNode<T extends ALRange> extends AppPoolAwareDescendantNode {
    private readonly _childNodes: Node[];
    private _noConsumption = false;

    protected readonly _range: T;
    protected override readonly _label: string;
    protected override readonly _uriPathPart: string;
    protected override _iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon =
        NinjaIcon["arrow-both"];
    protected override _collapsibleState = TreeItemCollapsibleState.Expanded;

    protected abstract _includeLogicalNameInDescription: boolean;
    protected abstract _includeLogicalNameInLabel: boolean;

    constructor(parent: AppPoolAwareNode, range: T) {
        super(parent);
        this._range = range;
        this._label = `${range.from}..${range.to}`;
        this._tooltip = `From ${range.from} to ${range.to}`;
        this._uriPathPart = `${range.from}-${range.to}`;
        this._childNodes = this.calculateChildren();
    }

    protected calculateChildren(): Node[] {
        const children: Node[] = [];
        for (let key of Object.values<string>(ALObjectType)) {
            const type = key as ALObjectType;
            if (this.rootNode.consumption[type] === undefined || this.rootNode.consumption[type].length === 0) {
                continue;
            }
            const ids = this.rootNode.consumption[type].filter(id => id >= this.range.from && id <= this.range.to);
            if (ids.length === 0) {
                continue;
            }
            children.push(new ObjectTypeConsumptionNode(this, key, ids, this.size));
        }

        if (children.length === 0) {
            this._noConsumption = true;
            this._collapsibleState = TreeItemCollapsibleState.None;
            this._decoration = {
                badge: "-",
                severity: DecorationSeverity.inactive,
                tooltip: `No consumption has been recorded`,
            };
            this._iconPath = NinjaIcon["arrow-both-inactive"];
        } else {
            this._decoration = undefined;
        }

        return children;
    }

    protected override completeTreeItem(item: TreeItem): void {
        super.completeTreeItem(item);

        const ninjaRange = this._range as unknown as NinjaALRange;
        if (ninjaRange && ninjaRange.description) {
            if (this._includeLogicalNameInDescription) {
                item.description = ninjaRange.description;
            }
            if (this._includeLogicalNameInLabel) {
                item.label = `${item.label} (${ninjaRange.description})`;
            }
        }

        if (this._noConsumption) {
            item.description = `${item.description || ""} (no consumption)`.trim();
        }
    }

    protected override getChildren(): Node[] {
        return this._childNodes;
    }

    public get range() {
        return this._range;
    }

    public get size() {
        return this._range.to - this._range.from + 1;
    }
}
