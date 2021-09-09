import { MarkdownString, StatusBarAlignment, StatusBarItem, window } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { Authorization } from "../lib/Authorization";

let status: StatusBarItem;

function updateStatusBar() {
    let document = window.activeTextEditor?.document;
    if (!document || !ALWorkspace.isALWorkspace(document.uri)) {
        status.hide();
        return;
    }

    let authKey = Authorization.read(document.uri);

    status.text = `$(${authKey ? "lock" : "unlock"}) ${authKey ? "Authorized" : "Unauthorized"}`;
    status.command = authKey ? undefined : "vjeko-al-objid.deauthorize-app";
    status.tooltip = authKey 
        ? "Your application is authorized with Vjeko.com AL Object ID Ninja back end. Your data exchange is secure."
        : new MarkdownString("Your application is not authorized. Please run the `Vjeko: Authorize AL App` command");
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
