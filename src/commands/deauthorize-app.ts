import { Uri, window } from "vscode";
import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { ALWorkspace } from "../lib/ALWorkspace";
import { AppManifest, getManifest } from "../lib/AppManifest";
import { Authorization } from "../lib/Authorization";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";

function deleteAuthorizationFile(uri: Uri, manifest: AppManifest): boolean {
    let result = Authorization.delete(uri);
    if (result !== true) {
        UI.authorization.showDeauthorizationFailedWarning(manifest.id, result);
        return false;
    }
    return true;
}

export const deauthorizeApp = async (uri?: Uri, repeat: boolean = false) => {
    if (!uri) uri = await ALWorkspace.selectWorkspaceFolder();
    if (!uri) {
        UI.general.showNoWorkspacesOpenInfo();
        return;
    }

    const manifest = getManifest(uri)!;
    const key = Authorization.read(uri);
    if (!key) {
        UI.authorization.showNotAuthorizedWarning(manifest.id);
        return;
    }

    let response = await Backend.deauthorizeApp(manifest.id, key?.key || "");
    if (response && deleteAuthorizationFile(uri, manifest)) {
        UI.authorization.showDeauthorizationSuccessfulInfo(manifest.id);
    }

    AuthorizationStatusBar.instance.updateStatusBar();
};
