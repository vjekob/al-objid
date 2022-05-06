import { ThemeIcon, TreeItemCollapsibleState, Uri } from "vscode";
import { AppManifest } from "../../lib/types";
import { ExplorerItem } from "./ExplorerItem";
import { ExplorerItemFactory } from "./ExplorerItemFactory";
import { ExplorerItemType } from "./ExplorerItemType";
import { RangeExplorerTreeDataProvider } from "./RangeExplorerTreeDataProvider";

export class WorkspaceExplorerItem extends ExplorerItem {
    private _manifest: AppManifest;

    constructor(manifest: AppManifest) {
        super(manifest.name, `${manifest.name} v${manifest.version}`);
        this._manifest = manifest;
        this.collapsibleState = TreeItemCollapsibleState.Expanded;
        this.iconPath = ThemeIcon.Folder;
        this.id = RangeExplorerTreeDataProvider.instance.getUriString(manifest.id);
        this.resourceUri = Uri.parse(this.id);
        this.contextValue = "ninja-folder";
    }

    get manifest() {
        return this._manifest;
    }

    type = ExplorerItemType.workspace;
    hasChildren = true;

    override getChildren(): ExplorerItem[] {
        const ranges = this._manifest.ninja.config.idRanges.length
            ? this._manifest.ninja.config.idRanges
            : this._manifest.idRanges;
        return ranges.map(range => ExplorerItemFactory.range(this._manifest.id, range));
    }
}
