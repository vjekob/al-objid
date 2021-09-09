import { Uri } from "vscode";
import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { ALWorkspace } from "../lib/ALWorkspace";
import { AppManifest, getManifest } from "../lib/AppManifest";
import { Authorization } from "../lib/Authorization";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";

function deleteAuthorizationFile(uri: Uri, manifest: AppManifest): boolean {
    let result = Authorization.delete(uri);
    if (result !== true) {
        UI.authorization.showDeauthorizationFailedWarning(manifest, result);
        return false;
    }
    return true;
}

export const deauthorizeApp = async (uri?: Uri, token?: { success: boolean }) => {
    if (!uri) uri = await ALWorkspace.selectWorkspaceFolder();
    if (!uri) {
        UI.general.showNoWorkspacesOpenInfo();
        return;
    }

    const manifest = getManifest(uri)!;
    const key = Authorization.read(uri);
    if (!key) {
        UI.authorization.showNotAuthorizedWarning(manifest);
        return;
    }

    let response = await Backend.deauthorizeApp(manifest.id, key?.key || "", async (response) => {
        switch (response.error.statusCode) {
            case 401:
                UI.authorization.showIncorrectKeyWarning(manifest);
                return true;
            case 405:
                UI.authorization.showNotAuthorizedWarning(manifest);
                return true;
            default:
                return false;
        }
    });
    if (response && deleteAuthorizationFile(uri, manifest)) {
        if (token) {
            token.success = true;
        } else {
            UI.authorization.showDeauthorizationSuccessfulInfo(manifest);
        }
    }

    AuthorizationStatusBar.instance.updateStatusBar();
};
