import { TreeItemSeverity } from "./TreeItemSeverity";

export interface Decoration {
    severity?: TreeItemSeverity;
    badge?: string;
    propagate?: boolean;
}
