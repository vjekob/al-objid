import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { AppManifest } from "../../lib/types";
import { NinjaExplorerItem } from "../Explorer/ExplorerItem";
import { RangeExplorerItem } from "./RangeExplorerItem";
import { RangeExplorerTreeDataProvider } from "./RangeExplorerTreeDataProvider";

export class WorkspaceExplorerItem implements NinjaExplorerItem {
    private readonly _label: string;
    private readonly _tooltip: string;
    private readonly _collapsibleState: TreeItemCollapsibleState;
    private readonly _id: string;
    private readonly _resourceUri: Uri;
    private readonly _manifest: AppManifest;
    private _children: NinjaExplorerItem[] | undefined;

    constructor(manifest: AppManifest) {
        this._label = manifest.name;
        this._tooltip = `${manifest.name} v${manifest.version}`;
        this._manifest = manifest;
        this._collapsibleState = TreeItemCollapsibleState.Expanded;
        this._id = RangeExplorerTreeDataProvider.instance.getUriString(manifest.id);
        this._resourceUri = Uri.parse(this._id);
    }

    get children() {
        if (this._children) {
            return this._children;
        }

        const ranges = this._manifest.ninja.config.idRanges.length
            ? this._manifest.ninja.config.idRanges
            : this._manifest.idRanges;

        this._children = ranges.map(range => new RangeExplorerItem(this._manifest.id, range));

        return this._children;
    }

    public getTreeItem() {
        const item = new TreeItem(this._label, this._collapsibleState);
        item.tooltip = this._tooltip;
        item.iconPath = ThemeIcon.Folder;
        item.id = this._id;
        item.resourceUri = this._resourceUri;
        item.contextValue = "ninja-folder"; // Referenced in package.json when view condition
        return item;
    }
}
