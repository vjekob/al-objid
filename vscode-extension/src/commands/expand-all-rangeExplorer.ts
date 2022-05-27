import { ExpandCollapseController } from "../features/Explorer/ExpandCollapseController";

export function expandAllRangeExplorer() {
    const controller = ExpandCollapseController.getController("ninja-rangeExplorer");
    controller?.expandAll();
}
