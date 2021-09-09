import { Uri } from "vscode";
import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { Authorization } from "../lib/Authorization";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";
import { deauthorizeApp } from "./deauthorize-app";

export const authorizeApp = async (uri?: Uri, repeat: boolean = false) => {
    if (!uri) uri = await ALWorkspace.selectWorkspaceFolder();
    if (!uri) {
        UI.general.showNoWorkspacesOpenInfo();
        return;
    }

    const manifest = getManifest(uri);
    let response = await Backend.authorizeApp(manifest!.id, async (response) => {
        const { error } = response;
        if (error.statusCode !== 405) return false;

        const result = await UI.authorization.showAlreadyAuthorizedWarning(manifest!.id);
        if (result === "Yes") {
            let key = Authorization.read(uri!);
            if (!key) {
                UI.authorization.showNoKeyError(manifest!.id);
            }
            let token = { success: false };
            await deauthorizeApp(uri, token);
            if (token.success) {
                authorizeApp(uri, true);
            }
        }
        return true;
    });

    if (!response || !response.authKey) return;

    Authorization.write(uri, response.authKey);
    if (repeat) {
        UI.authorization.showReauthorizedInfo(manifest!.id);
    } else {
        UI.authorization.showAuthorizationSuccessfulInfo(manifest!.id);
    }

    AuthorizationStatusBar.instance.updateStatusBar();
};
