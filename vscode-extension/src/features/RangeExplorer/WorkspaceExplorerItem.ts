import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { AppManifest } from "../../lib/types";
import { NinjaExplorerItem, UpdateNinjaExplorerItem } from "../Explorer/NinjaExplorerItem";
import { RangeExplorerItem } from "./RangeExplorerItem";
import { RangeExplorerTreeDataProvider } from "./RangeExplorerTreeDataProvider";

export class WorkspaceExplorerItem implements NinjaExplorerItem {
    private readonly _label: string;
    private readonly _tooltip: string;
    private readonly _collapsibleState: TreeItemCollapsibleState;
    private readonly _id: string;
    private readonly _resourceUri: Uri;
    private readonly _manifest: AppManifest;
    private readonly _update: UpdateNinjaExplorerItem;
    private _children: NinjaExplorerItem[] | undefined;

    constructor(manifest: AppManifest, update: UpdateNinjaExplorerItem) {
        this._label = manifest.name;
        this._tooltip = `${manifest.name} v${manifest.version}`;
        this._manifest = manifest;
        this._collapsibleState = TreeItemCollapsibleState.Expanded;
        this._id = RangeExplorerTreeDataProvider.instance.getUriString(manifest.id);
        this._resourceUri = Uri.parse(this._id);
        this._update = update;
    }

    public parent = undefined;

    public get children(): NinjaExplorerItem[] {
        if (this._children) {
            return this._children;
        }

        const ranges = this._manifest.ninja.config.idRanges.length
            ? this._manifest.ninja.config.idRanges
            : this._manifest.idRanges;

        this._children = ranges.map(
            range => new RangeExplorerItem(this._manifest.id, range, this, this._update)
        );

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
