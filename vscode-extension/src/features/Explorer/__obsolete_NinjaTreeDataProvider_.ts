import { TreeDataProvider } from "vscode";
import { ExpandCollapseController } from "./ExpandCollapseController";
import { __obsolete_INinjaTreeItem_ } from "./__obsolete_NinjaTreeItem_";

export interface __obsolete_NinjaTreeDataProvider_ extends TreeDataProvider<__obsolete_INinjaTreeItem_> {
    registerExpandCollapseController(controller: ExpandCollapseController): void;
}
