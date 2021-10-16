import { TreeItem, TreeItemLabel } from "vscode";
import { ExplorerItemType } from "./ExplorerItemType";

export abstract class ExplorerItem extends TreeItem {
    protected constructor(label: string | TreeItemLabel, tooltip: string, description?: string) {
        super(label);
        this.tooltip = tooltip;
        if (description) {
            this.description = description;
        }
    }

    abstract get type(): ExplorerItemType;
    abstract get hasChildren(): boolean;

    public getChildren(): ExplorerItem[] {
        return [];
    }
}
