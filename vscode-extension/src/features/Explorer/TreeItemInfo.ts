import { ExplorerItemType } from "./ExplorerItemType";
import { TreeItemSeverity } from "./TreeItemSeverity";

export interface TreeItemInfo {
    type: ExplorerItemType;
    severity?: TreeItemSeverity;
    remaining?: number;
    propagate?: boolean;
}
