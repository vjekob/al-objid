import { StatusBarAlignment, StatusBarItem, window } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getAuthorization } from "../lib/Authorization";

let status: StatusBarItem;

function updateStatusBar() {
    let document = window.activeTextEditor?.document;
    if (!document || !ALWorkspace.isALWorkspace(document.uri)) {
        status.hide();
        return;
    }

    let authKey = getAuthorization(document.uri);

    status.text = `$(${authKey ? "lock" : "unlock"}) ${authKey ? "Authorized" : "Unauthorized"}`;
    status.show();
}

export const getStatusBarDisposables = () => {
    status = window.createStatusBarItem(StatusBarAlignment.Left, 1);
    updateStatusBar();

    return [
        window.onDidChangeActiveTextEditor(updateStatusBar),
        status,
    ]
};
