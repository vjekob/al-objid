import { TreeDataProvider } from "vscode";
import { ExpandCollapseController } from "./ExpandCollapseController";
import { INinjaTreeItem } from "./NinjaTreeItem";

export interface NinjaTreeDataProvider extends TreeDataProvider<INinjaTreeItem> {
    registerExpandCollapseController(controller: ExpandCollapseController): void;
}
