import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { LogLevel, output } from "../features/Output";
import { Backend } from "../lib/backend/Backend";
import { UI } from "../lib/UI";
import { Telemetry } from "../lib/Telemetry";
import { Git } from "../lib/Git";
import { getAppNames } from "../lib/functions/getAppNames";
import { showDocument } from "../lib/functions/showDocument";
import { CONFIG_FILE_NAME, DOCUMENTS } from "../lib/constants";
import { WorkspaceManager } from "../features/WorkspaceManager";

export const authorizeApp = async () => {
    const apps = await WorkspaceManager.instance.pickFolders("to authorize");
    if (!apps || apps.length === 0) {
        return;
    }

    const success = await Git.instance.executeCleanOperation({
        apps,
        operation: async app => {
            output.log(`Authorizing app "${app.manifest.name}" id ${app.hash}`, LogLevel.Info);

            Telemetry.instance.log("authorize", app.hash);
            const gitUser = await Git.instance.getUserInfo(app.manifest.uri);
            let response = await Backend.authorizeApp(app, gitUser.name, gitUser.email, async response => {
                const { error } = response;
                if (error.statusCode !== 405) {
                    return false;
                }

                UI.authorization.showAlreadyAuthorizedError(app);
                return true;
            });

            if (!response || !response.authKey) {
                return false;
            }

            app.config.authKey = response.authKey;
            UI.authorization.showAuthorizationSuccessfulInfo(app);
            return true;
        },
        getFilesToStage: () => [CONFIG_FILE_NAME],
        learnMore: () => showDocument(DOCUMENTS.AUTHORIZATION_GIT),
        getCommitMessage: apps => `AL Object ID Ninja app authorization for ${getAppNames(apps)}`,
    });

    if (success) {
        AuthorizationStatusBar.instance.updateStatusBar();
        showDocument(DOCUMENTS.AUTHORIZED);
    }
};
