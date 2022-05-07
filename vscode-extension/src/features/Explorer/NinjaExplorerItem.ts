import { TreeItem } from "vscode";

export interface NinjaExplorerItem {
    getTreeItem: () => TreeItem;
    children: NinjaExplorerItem[] | Promise<NinjaExplorerItem[]>;
    parent: NinjaExplorerItem | undefined;
}

export interface UpdateNinjaExplorerItem {
    (item: NinjaExplorerItem): void;
}
