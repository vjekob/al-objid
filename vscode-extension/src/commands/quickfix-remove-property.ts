import { DocumentSymbol, TextEdit, Uri, workspace, WorkspaceEdit } from "vscode";

export async function quickFixRemoveProperty(uri: Uri, symbol: DocumentSymbol) {
    let remove = new WorkspaceEdit();
    remove.set(uri, [TextEdit.delete(symbol.range)]);
    workspace.applyEdit(remove);
}
