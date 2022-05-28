import { ExpandCollapseController } from "../features/treeView/ExpandCollapseController";

export function collapseAllRangeExplorer() {
    const controller = ExpandCollapseController.getController("ninja-rangeExplorer");
    controller?.collapseAll();
}
