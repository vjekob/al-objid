import path = require("path");
import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { ALRange, NinjaALRange } from "../../lib/types";
import { ConsumptionCache } from "../ConsumptionCache";
import { ObjectTypeExplorerItem } from "./ObjectTypeExplorerItem";
import { RangeExplorerTreeDataProvider } from "./RangeExplorerTreeDataProvider";
import { TextExplorerItem } from "../Explorer/TextExplorerItem";
import { NinjaExplorerItem } from "../Explorer/ExplorerItem";

const light = path.join(__filename, "..", "..", "..", "..", "images", "brackets-square-light.svg");
const dark = path.join(__filename, "..", "..", "..", "..", "images", "brackets-square-dark.svg");

export class RangeExplorerItem implements NinjaExplorerItem {
    private readonly _label: string;
    private readonly _tooltip: string;
    private readonly _description: string;
    private readonly _collapsibleState: TreeItemCollapsibleState;
    private readonly _appId: string;
    private readonly _range: ALRange;
    private readonly _id: string;
    private readonly _resourceUri: Uri;
    private _children: NinjaExplorerItem[] | undefined;

    constructor(appId: string, range: ALRange) {
        const description = (range as NinjaALRange).description || "";
        const addition = description ? ` (${description})` : "";

        this._label = `${range.from}..${range.to}`;
        this._tooltip = `From ${range.from} to ${range.to}${addition}`;
        this._description = description;

        this._collapsibleState = TreeItemCollapsibleState.Expanded;
        this._appId = appId;
        this._range = range;
        this._id = RangeExplorerTreeDataProvider.instance.getUriString(appId, range);
        this._resourceUri = Uri.parse(this._id);
    }

    public getTreeItem() {
        const item = new TreeItem(this._label, this._collapsibleState);
        item.tooltip = this._tooltip;
        item.description = this._description;
        item.collapsibleState = this._collapsibleState;
        item.iconPath = { light, dark };
        item.id = this._id;
        item.resourceUri = this._resourceUri;
        return item;
    }

    public get children(): NinjaExplorerItem[] {
        if (this._children) {
            return this._children;
        }

        this._children = [];

        const consumption = ConsumptionCache.instance.getConsumption(this._appId) as any;
        if (consumption) {
            for (var type of Object.keys(consumption).sort()) {
                const ids = ((consumption[type] as number[]) || []).filter(
                    id => id >= this._range.from && id <= this._range.to
                );
                if (ids.length) {
                    this._children.push(
                        new ObjectTypeExplorerItem(
                            this._appId,
                            this._range,
                            type,
                            ids,
                            Math.max(this._range.to - this._range.from, 0) + 1
                        )
                    );
                }
            }

            if (!this._children.length) {
                this._children.push(
                    new TextExplorerItem(
                        "No consumption yet.",
                        "No object IDs have been assigned from this range"
                    )
                );
            }
        }

        return this._children;
    }
}
