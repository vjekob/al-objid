import { TreeItemCollapsibleState } from "vscode";
import { INinjaTreeItem, NinjaTreeItemIcon, NinjaTreeItemLabel } from "./NinjaTreeItem";

export interface NinjaTreeItemProvider {
    getLabel: () => NinjaTreeItemLabel;
    getIcon: () => NinjaTreeItemIcon;
    getUriPath: () => string | Promise<string>;
    getCollapsibleState: () => TreeItemCollapsibleState | Promise<TreeItemCollapsibleState>;
    getTooltip?: () => string | Promise<string>;
    getContextValue?: () => string | Promise<string>;
    getDescription?: () => string | Promise<string>;
    getChildren?: () => INinjaTreeItem[];
    dispose?: () => void;
}
