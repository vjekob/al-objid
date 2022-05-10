import { TreeItemCollapsibleState } from "vscode";
import { INinjaTreeItem, NinjaTreeItemIcon, NinjaTreeItemLabel } from "./NinjaTreeItem";
import { TreeItemDecoration } from "./TreeItemDecoration";

export interface NinjaTreeItemProvider {
    getLabel: () => NinjaTreeItemLabel;
    getIcon: () => NinjaTreeItemIcon;
    getUriPath: () => string | Promise<string>;
    getCollapsibleState: () => TreeItemCollapsibleState | Promise<TreeItemCollapsibleState>;
    getTooltip?: () => string | Promise<string>;
    getContextValue?: () => string | Promise<string>;
    getDescription?: () => string | Promise<string>;
    getChildren?: () => INinjaTreeItem[];
    getDecoration?: () => TreeItemDecoration | undefined | Promise<TreeItemDecoration | undefined>;
    dispose?: () => void;
}
