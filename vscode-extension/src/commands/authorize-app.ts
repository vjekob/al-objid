import { Uri } from "vscode";
import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { output } from "../features/Output";
import { AppManifest } from "../lib/AppManifest";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";
import { deauthorizeApp } from "./deauthorize-app";
import { Telemetry } from "../lib/Telemetry";
import { authorization } from '../lib/Authorization';
import { Git } from "../lib/Git";

export const authorizeApp = async (uri: Uri, manifest: AppManifest, repeat: boolean = false) => {
    output.log(`Authorizing app "${manifest.name}" id ${manifest.id}`);

    Telemetry.instance.log("authorize", manifest.id);
    const gitUser = await Git.instance.getUserInfo(uri);
    let response = await Backend.authorizeApp(manifest.id, gitUser.name, gitUser.email, async (response) => {
        const { error } = response;
        if (error.statusCode !== 405) return false;

        const result = await UI.authorization.showAlreadyAuthorizedWarning(manifest);
        if (result === "Yes") {
            let { authKey } = ObjIdConfig.instance(uri!);
            if (!authKey) {
                UI.authorization.showNoKeyError(manifest);
            }
            let token = { success: false };
            await deauthorizeApp(uri, manifest, token);
            if (token.success) {
                authorizeApp(uri, manifest, true);
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

    await authorization.commitAuthorization(uri, "authorizing");

    AuthorizationStatusBar.instance.updateStatusBar();
    authorization.showAuthorizedDoc();
};
