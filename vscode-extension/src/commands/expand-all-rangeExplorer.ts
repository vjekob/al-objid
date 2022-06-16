import { ExpandCollapseController } from "../features/treeView/ExpandCollapseController";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

export function expandAllRangeExplorer() {
    const controller = ExpandCollapseController.getController("ninja-rangeExplorer");
    Telemetry.instance.logCommand(NinjaCommand.ExpandAllRangeExplorer);
    controller?.expandAll();
}
