import { window } from "vscode";

export const confirmAuthorizeApp = async () => {
    let result = window.showQuickPick(["Yes - authorize the app", "No, I've changed my mind"], {
        title: "Are you sure you want to authorize your app?"
    });
};

