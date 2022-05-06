import { TreeItemSeverity } from "../Explorer/TreeItemSeverity";

export interface TreeItemInfo {
    severity?: TreeItemSeverity;
    remaining?: number;
    propagate?: boolean;
}
