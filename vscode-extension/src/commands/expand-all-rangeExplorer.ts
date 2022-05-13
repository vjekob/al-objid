import { TreeViews } from "../features/Explorer/TreeViews";

export function expandAllRangeExplorer() {
    const controller = TreeViews.instance.getExpandCollapse("ninja-rangeExplorer");
    controller?.expandAll();
}
