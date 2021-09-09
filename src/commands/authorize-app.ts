import { Uri } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { Authorization } from "../lib/Authorization";
import { API_RESULT, Backend } from "../lib/Backend";
import { UI } from "../lib/UI";

export const authorizeApp = async (uri?: Uri, repeat: boolean = false) => {
    if (!uri) uri = await ALWorkspace.selectWorkspaceFolder();
    if (!uri) {
        UI.general.showNoWorkspacesOpenInfo();
        return;
    }

    const manifest = getManifest(uri);
    let response = await Backend.authorizeApp(manifest!.id);
    if (response === API_RESULT.ERROR_ALREADY_AUTHORIZED) {
        const result = await UI.authorization.showAlreadyAuthorizedWarning(manifest!.id);
        if (result === "Yes") {
            let key = Authorization.read(uri);
            if (!key) {
                UI.authorization.showNoKeyError(manifest!.id);
                return;
            }
            let success = await Backend.deauthorizeApp(manifest!.id, key!.key);
            if (success) {
                authorizeApp(uri, true);
            }
        }
        return;
    }
    if (typeof response === "object" && response.authKey) {
        Authorization.write(uri, response.authKey);
        if (repeat) {
            UI.authorization.showReauthorizedInfo(manifest!.id);
        } else {
            UI.authorization.showAuthorizationSuccessfulInfo(manifest!.id);
        }
    }
};
