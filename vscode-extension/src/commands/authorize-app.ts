import { Uri } from "vscode";
import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { LogLevel, output } from "../features/Output";
import { CONFIG_FILE_NAME, ObjIdConfig } from "../lib/ObjIdConfig";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";
import { Telemetry } from "../lib/Telemetry";
import { Git } from "../lib/Git";
import { ALWorkspace } from "../lib/ALWorkspace";
import { showDocument } from "../lib/functions";

export const authorizeApp = async () => {
    const uris = await ALWorkspace.pickFolder(true, "to authorize") as Uri[];
    if (!uris) {
        return;
    }

    const success = await Git.instance.executeCleanOperation({
        uris,
        operation: async (manifest) => {
            output.log(`Authorizing app "${manifest.name}" id ${manifest.id}`, LogLevel.Info);

            Telemetry.instance.log("authorize", manifest.id);
            const gitUser = await Git.instance.getUserInfo(manifest.ninja.uri);
            let response = await Backend.authorizeApp(manifest.id, gitUser.name, gitUser.email, async (response) => {
                const { error } = response;
                if (error.statusCode !== 405) {
                    return false;
                }

                await UI.authorization.showAlreadyAuthorizedError(manifest);
                return true;
            });

            if (!response || !response.authKey) {
                return false;
            }

            ObjIdConfig.instance(manifest.ninja.uri).authKey = response.authKey;
            UI.authorization.showAuthorizationSuccessfulInfo(manifest);
            return true;
        },
        getFilesToStage: () => [CONFIG_FILE_NAME],
        learnMore: () => showDocument("authorization-git"),
        getCommitMessage: (manifest) => `AL Object ID Ninja app authorization for ${manifest.name}`
    });

    if (success) {
        AuthorizationStatusBar.instance.updateStatusBar();
        showDocument("authorized");
    }
}
