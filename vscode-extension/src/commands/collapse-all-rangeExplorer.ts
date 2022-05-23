import { __obsolete_TreeViews_ } from "../features/Explorer/__obsolete_TreeViews_";

export function collapseAllRangeExplorer() {
    const controller = __obsolete_TreeViews_.instance.getExpandCollapse("ninja-rangeExplorer");
    controller?.collapseAll();
}
