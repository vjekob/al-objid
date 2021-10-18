import { Uri } from "vscode";
import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { output } from "../features/Output";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";
import { Telemetry } from "../lib/Telemetry";

export const deauthorizeApp = async (uri?: Uri, token?: { success: boolean }) => {
    if (!uri) uri = await ALWorkspace.selectWorkspaceFolder();
    if (!uri) {
        UI.general.showNoWorkspacesOpenInfo();
        return;
    }

    const manifest = getManifest(uri)!;
    output.log(`Deauthorizing app "${manifest.name}" id ${manifest.id}`);

    if (!ObjIdConfig.instance(uri).authKey) {
        UI.authorization.showNotAuthorizedWarning(manifest);
        return;
    }

    Telemetry.instance.log("deauthorize", manifest.id);
    let response = await Backend.deauthorizeApp(manifest.id, ObjIdConfig.instance(uri).authKey || "", async (response) => {
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
    if (response) {
        ObjIdConfig.instance(uri).authKey = "";
        if (token) {
            token.success = true;
        } else {
            UI.authorization.showDeauthorizationSuccessfulInfo(manifest);
        }
    }

    AuthorizationStatusBar.instance.updateStatusBar();
};
