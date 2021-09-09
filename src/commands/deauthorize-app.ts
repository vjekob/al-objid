import { Uri } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";
import { getAuthorization } from "../lib/Authorization";

export const deauthorizeApp = async (uri?: Uri, repeat: boolean = false) => {
    if (!uri) uri = await ALWorkspace.selectWorkspaceFolder();
    if (!uri) {
        UI.general.showNoWorkspacesOpenInfo();
        return;
    }

    const manifest = getManifest(uri);
    const key = getAuthorization(uri);
    let response = await Backend.deauthorizeApp(manifest!.id, key?.key || "");
    if (response)
        UI.authorization.showDeauthorizationSuccessfulInfo(manifest!.id);
};
