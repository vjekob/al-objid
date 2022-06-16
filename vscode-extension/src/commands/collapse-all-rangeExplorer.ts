import { ExpandCollapseController } from "../features/treeView/ExpandCollapseController";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

export function collapseAllRangeExplorer() {
    const controller = ExpandCollapseController.getController("ninja-rangeExplorer");
    Telemetry.instance.logCommand(NinjaCommand.CollapseAllRangeExplorer);
    controller?.collapseAll();
}
