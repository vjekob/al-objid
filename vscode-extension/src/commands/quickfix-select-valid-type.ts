import { Range, TextDocument, TextEdit, window, workspace, WorkspaceEdit } from "vscode";

export async function quickFixSelectValidType(
    document: TextDocument,
    range: Range,
    remainingTypes: string[]
) {
    const selectedType = await window.showQuickPick(remainingTypes, {
        placeHolder: "Select an object type...",
    });
    if (!selectedType) {
        return;
    }

    let replace = new WorkspaceEdit();
    replace.set(document.uri, [TextEdit.replace(range, `"${selectedType}"`)]);
    await workspace.applyEdit(replace);
    await document.save();
}
