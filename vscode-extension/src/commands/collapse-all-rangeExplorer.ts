import { TreeViews } from "../features/Explorer/TreeViews";

export function collapseAllRangeExplorer() {
    const controller = TreeViews.instance.getExpandCollapse("ninja-rangeExplorer");
    controller?.collapseAll();
}
