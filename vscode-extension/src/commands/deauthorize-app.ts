import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { LogLevel, output } from "../features/Output";
import { Backend } from "../lib/backend/Backend";
import { UI } from "../lib/UI";
import { Telemetry } from "../lib/Telemetry";
import { Git } from "../lib/Git";
import { getAppNames } from "../lib/functions/getAppNames";
import { showDocument } from "../lib/functions/showDocument";
import { DOCUMENTS, CONFIG_FILE_NAME } from "../lib/constants";
import { WorkspaceManager } from "../features/WorkspaceManager";
import { NinjaCommand } from "./commands";

export const deauthorizeApp = async () => {
    const apps = await WorkspaceManager.instance.pickFolders("to deauthorize");
    if (!apps) {
        return;
    }

    const success = await Git.instance.executeCleanOperation({
        apps,
        operation: async app => {
            output.log(`Deauthorizing app "${app.manifest.name}" id ${app.hash}`, LogLevel.Info);

            if (!app.config.authKey) {
                UI.authorization.showNotAuthorizedWarning(app);
                return false;
            }

            Telemetry.instance.logAppCommand(app, NinjaCommand.DeauthorizeApp);
            let response = await Backend.deauthorizeApp(app, async response => {
                switch (response.error.statusCode) {
                    case 401:
                        UI.authorization.showIncorrectKeyWarning(app);
                        return true;
                    case 405:
                        UI.authorization.showNotAuthorizedWarning(app);
                        return true;
                    default:
                        return false;
                }
            });

            if (!response) {
                return false;
            }

            app.config.authKey = "";
            UI.authorization.showDeauthorizationSuccessfulInfo(app);
            return true;
        },
        getFilesToStage: () => [CONFIG_FILE_NAME],
        learnMore: () => showDocument(DOCUMENTS.AUTHORIZATION_GIT),
        getCommitMessage: apps => `AL Object ID Ninja app deauthorization for ${getAppNames(apps)}`,
    });

    if (success) {
        AuthorizationStatusBar.instance.updateStatusBar();
    }
};
