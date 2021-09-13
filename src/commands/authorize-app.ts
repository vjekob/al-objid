import { Uri } from "vscode";
import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { output } from "../features/Output";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";
import { deauthorizeApp } from "./deauthorize-app";

export const authorizeApp = async (uri?: Uri, repeat: boolean = false) => {
    if (!uri) uri = await ALWorkspace.selectWorkspaceFolder();
    if (!uri) {
        UI.general.showNoWorkspacesOpenInfo();
        return;
    }

    const manifest = getManifest(uri)!;

    output.log(`Authorizing app "${manifest.name}" id ${manifest.id}`);

    let response = await Backend.authorizeApp(manifest!.id, async (response) => {
        const { error } = response;
        if (error.statusCode !== 405) return false;

        const result = await UI.authorization.showAlreadyAuthorizedWarning(manifest);
        if (result === "Yes") {
            let { authKey } = ObjIdConfig.instance(uri!);
            if (!authKey) {
                UI.authorization.showNoKeyError(manifest);
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

    ObjIdConfig.instance(uri).authKey = response.authKey;
    if (repeat) {
        UI.authorization.showReauthorizedInfo(manifest);
    } else {
        UI.authorization.showAuthorizationSuccessfulInfo(manifest);
    }

    AuthorizationStatusBar.instance.updateStatusBar();
};
