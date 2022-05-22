import { TreeItemCollapsibleState } from "vscode";
import {
    __obsolete_INinjaTreeItem_,
    __obsolete_NinjaTreeItemIcon_,
    __obsolete_NinjaTreeItemLabel_,
} from "./__obsolete_NinjaTreeItem_";
import { TreeItemDecoration } from "./TreeItemDecoration";

export interface __obsolete_NinjaTreeItemProvider_ {
    getLabel: () => __obsolete_NinjaTreeItemLabel_;
    getIcon: () => __obsolete_NinjaTreeItemIcon_;
    getUriPath: () => string | Promise<string>;
    getCollapsibleState: () => TreeItemCollapsibleState | Promise<TreeItemCollapsibleState>;
    getTooltip?: () => string | Promise<string>;
    getContextValue?: () => string | Promise<string>;
    getDescription?: () => string | Promise<string>;
    getChildren?: (parent: __obsolete_INinjaTreeItem_) => __obsolete_INinjaTreeItem_[];
    getDecoration?: () => TreeItemDecoration | undefined | Promise<TreeItemDecoration | undefined>;
    dispose?: () => void;
}
