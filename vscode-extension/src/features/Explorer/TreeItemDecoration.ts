import { TreeItemSeverity } from "./TreeItemSeverity";

export interface TreeItemDecoration {
    severity?: TreeItemSeverity;
    badge?: string;
    propagate?: boolean;
}
