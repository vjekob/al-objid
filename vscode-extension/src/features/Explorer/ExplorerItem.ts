import { TreeItem } from "vscode";

export interface NinjaExplorerItem {
    getTreeItem: () => TreeItem;
    children: NinjaExplorerItem[];
}
