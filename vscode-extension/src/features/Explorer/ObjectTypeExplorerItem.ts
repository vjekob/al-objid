import path = require("path");
import { Uri } from "vscode";
import { ALRange } from "../../lib/types";
import { ExplorerItem } from "./ExplorerItem";
import { ExplorerItemType } from "./ExplorerItemType";
import { ExplorerTreeDataProvider } from "./ExplorerTreeDataProvider";

export class ObjectTypeExplorerItem extends ExplorerItem {
    constructor(appId: string, range: ALRange, objectType: string, ids: number[], size: number) {
        super(
            `${objectType}`,
            `${ids.length} assigned ${objectType} object(s)`,
            `${Math.round((ids.length / size) * 100)}% (${ids.length} of ${size})`
        );

        const uri = ExplorerTreeDataProvider.instance.getUriString(appId, range, objectType);
        const info = ExplorerTreeDataProvider.instance.getTreeItemInfo(uri);

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
        const light = path.join(__filename, "..", "..", "..", "..", "images", `${icon}-light.svg`);
        const dark = path.join(__filename, "..", "..", "..", "..", "images", `${icon}-dark.svg`);
        this.iconPath = { dark, light };

        this.resourceUri = Uri.parse(uri);
        this.id = uri;
    }

    type = ExplorerItemType.objectType;
    hasChildren = false;
}
