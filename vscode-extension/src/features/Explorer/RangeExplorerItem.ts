import path = require("path");
import { TreeItemCollapsibleState, Uri } from "vscode";
import { ALRange, NinjaALRange } from "../../lib/types";
import { ConsumptionCache } from "../ConsumptionCache";
import { ExplorerItem } from "./ExplorerItem";
import { ExplorerItemFactory } from "./ExplorerItemFactory";
import { ExplorerItemType } from "./ExplorerItemType";
import { ExplorerTreeDataProvider } from "./ExplorerTreeDataProvider";

const light = path.join(__filename, "..", "..", "..", "..", "images", "brackets-square-light.svg");
const dark = path.join(__filename, "..", "..", "..", "..", "images", "brackets-square-dark.svg");

export class RangeExplorerItem extends ExplorerItem {
    private _appId: string;
    private _range: ALRange;

    constructor(appId: string, range: ALRange) {
        super("", "", ""); // All three will be configured immediately

        const description = (range as NinjaALRange).description || "";
        const addition = description ? ` (${description})` : "";

        this.label = `${range.from}..${range.to}`;
        this.tooltip = `From ${range.from} to ${range.to}${addition}`;
        this.description = description;

        this.collapsibleState = TreeItemCollapsibleState.Expanded;
        this.iconPath = { light, dark };
        this._appId = appId;
        this._range = range;
        this.id = ExplorerTreeDataProvider.instance.getUriString(appId, range);
        this.resourceUri = Uri.parse(this.id);
    }

    type = ExplorerItemType.range;
    hasChildren = true;

    override getChildren(): ExplorerItem[] {
        const children = [];

        const consumption = ConsumptionCache.instance.getConsumption(this._appId) as any;
        if (consumption) {
            for (var type of Object.keys(consumption).sort()) {
                const ids = ((consumption[type] as number[]) || []).filter(
                    id => id >= this._range.from && id <= this._range.to
                );
                if (ids.length) {
                    children.push(
                        ExplorerItemFactory.objectType(
                            this._appId,
                            this._range,
                            type,
                            ids,
                            Math.max(this._range.to - this._range.from, 0) + 1
                        )
                    );
                }
            }

            if (!children.length) {
                children.push(
                    ExplorerItemFactory.text(
                        "No consumption yet.",
                        "No object IDs have been assigned from this range"
                    )
                );
            }
        }

        return children;
    }
}
