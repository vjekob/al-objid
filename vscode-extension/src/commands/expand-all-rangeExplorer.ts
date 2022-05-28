import { ExpandCollapseController } from "../features/treeView/ExpandCollapseController";

export function expandAllRangeExplorer() {
    const controller = ExpandCollapseController.getController("ninja-rangeExplorer");
    controller?.expandAll();
}
