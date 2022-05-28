import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { ALObjectType } from "../../lib/types/ALObjectType";
import { ALRange } from "../../lib/types/ALRange";
import { ConsumptionData } from "../../lib/types/ConsumptionData";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { ConsumptionCache } from "../ConsumptionCache";
import { AppAwareNode, AppAwareDescendantNode } from "../Explorer/AppAwareNode";
import { Node } from "../Explorer/Node";
import { TextNode } from "../Explorer/TextNode";
import { ObjectTypeConsumptionNode } from "./ObjectTypeConsumptionNode";

/**
 * Represents a base type of node that displays range (from..to) as label.
 */
export abstract class RangeNode extends AppAwareDescendantNode {
    private readonly _range: ALRange;
    protected override readonly _label: string;
    protected override readonly _uriPathPart: string;
    protected override _iconPath = new ThemeIcon("arrow-both");
    protected override _collapsibleState = TreeItemCollapsibleState.Expanded;
    protected readonly _consumption: ConsumptionData;

    protected abstract _includeLogicalNameInDescription: boolean;
    protected abstract _includeLogicalNameInLabel: boolean;

    constructor(parent: AppAwareNode, range: ALRange) {
        super(parent);
        this._range = range;
        this._label = `${range.from}..${range.to}`;
        this._tooltip = `From ${range.from} to ${range.to}`;
        this._uriPathPart = `${range.from}-${range.to}`;
        this._consumption = ConsumptionCache.instance.getConsumption(this.app.hash) || {};
    }

    protected override completeTreeItem(item: TreeItem): void {
        super.completeTreeItem(item);

        const ninjaRange = this._range as NinjaALRange;
        if (ninjaRange && ninjaRange.description) {
            if (this._includeLogicalNameInDescription) {
                item.description = ninjaRange.description;
            }
            if (this._includeLogicalNameInLabel) {
                item.label = `${item.label} (${ninjaRange.description})`;
            }
        }
    }

    protected override getChildren(): Node[] {
        const children: Node[] = [];
        for (let key of Object.values<string>(ALObjectType)) {
            const type = key as ALObjectType;
            if (this._consumption[type] === undefined || this._consumption[type].length === 0) {
                continue;
            }
            const ids = this._consumption[type].filter(id => id >= this.range.from && id <= this.range.to);
            if (ids.length === 0) {
                continue;
            }
            children.push(new ObjectTypeConsumptionNode(this, key, ids, this.size));
        }

        if (children.length === 0) {
            // TODO Display ranges with no consumption using decorations, rather than text nodes
            // Instead of showing a child node that says "no consumption yet", create a non-expandable node, grayed out
            // with description "No consumption" or something similar
            children.push(
                new TextNode(
                    "No consumption yet",
                    `No ids are assigned in this range (${this.range.from} to ${this.range.to}).`
                )
            );
        }

        return children;
    }

    public get range() {
        return this._range;
    }

    public get size() {
        return this._range.to - this._range.from + 1;
    }
}
