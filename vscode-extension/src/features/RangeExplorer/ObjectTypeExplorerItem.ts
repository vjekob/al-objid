import path = require("path");
import { TreeItem, Uri } from "vscode";
import { ALRange } from "../../lib/types";
import { NinjaExplorerItem } from "../Explorer/NinjaExplorerItem";
import { RangeExplorerItem } from "./RangeExplorerItem";
import { RangeExplorerTreeDataProvider } from "./RangeExplorerTreeDataProvider";

export class ObjectTypeExplorerItem implements NinjaExplorerItem {
    private readonly _parent: RangeExplorerItem;
    private readonly _label: string;
    private readonly _tooltip: string;
    private readonly _description: string;
    private readonly _id: string;
    private readonly _resourceUri: Uri;
    private readonly _light: string;
    private readonly _dark: string;

    constructor(
        appId: string,
        range: ALRange,
        objectType: string,
        ids: number[],
        size: number,
        parent: RangeExplorerItem
    ) {
        this._parent = parent;

        this._label = `${objectType}`;
        this._tooltip = `${ids.length} assigned ${objectType} object(s)`;
        this._description = `${Math.round((ids.length / size) * 100)}% (${ids.length} of ${size})`;

        const uri = RangeExplorerTreeDataProvider.instance.getUriString(appId, range, objectType);
        const info = RangeExplorerTreeDataProvider.instance.getTreeItemInfo(uri);

        const pct = Math.max(1 - ids.length / Math.max(size - 5, 0), 0);

        let iconPct = "100";
        if (pct < 0.85) {
            iconPct = "75";
            if (pct < 0.6) {
                iconPct = "50";
                if (pct < 0.35) {
                    iconPct = "25";
                }
            }
        }

        if (info.remaining! <= 5) {
            iconPct = "10";
            if (info.remaining! === 0) {
                iconPct = "0";
            }
        }

        const icon = `ids-${iconPct}`;
        this._light = path.join(__filename, "..", "..", "..", "..", "images", `${icon}-light.svg`);
        this._dark = path.join(__filename, "..", "..", "..", "..", "images", `${icon}-dark.svg`);

        this._resourceUri = Uri.parse(uri);
        this._id = uri;
    }

    public get parent(): RangeExplorerItem {
        return this._parent;
    }

    public children = [];

    public getTreeItem() {
        const item = new TreeItem(this._label);
        item.tooltip = this._tooltip;
        item.description = this._description;
        item.id = this._id;
        item.resourceUri = this._resourceUri;
        item.iconPath = { dark: this._dark, light: this._light };
        return item;
    }
}
