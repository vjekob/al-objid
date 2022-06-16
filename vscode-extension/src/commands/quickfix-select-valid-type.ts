import { Range, TextDocument, TextEdit, window, workspace, WorkspaceEdit } from "vscode";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

export async function quickFixSelectValidType(document: TextDocument, range: Range, remainingTypes: string[]) {
    const selectedType = await window.showQuickPick(remainingTypes, {
        placeHolder: "Select an object type...",
    });
    if (!selectedType) {
        return;
    }

    Telemetry.instance.logCommand(NinjaCommand.QuickFixSelectValidType, { type: selectedType });

    let replace = new WorkspaceEdit();
    replace.set(document.uri, [TextEdit.replace(range, `"${selectedType}"`)]);
    await workspace.applyEdit(replace);
    await document.save();
}
