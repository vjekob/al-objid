import { ExpandCollapseController } from "../features/Explorer/ExpandCollapseController";

export function collapseAllRangeExplorer() {
    const controller = ExpandCollapseController.getController("ninja-rangeExplorer");
    controller?.collapseAll();
}
