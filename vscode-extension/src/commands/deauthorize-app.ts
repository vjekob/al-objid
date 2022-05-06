import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { LogLevel, output } from "../features/Output";
import { CONFIG_FILE_NAME } from "../lib/ObjIdConfig";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";
import { Telemetry } from "../lib/Telemetry";
import { ALWorkspace } from "../lib/ALWorkspace";
import { Git } from "../lib/Git";
import { showDocument } from "../lib/functions";
import { getAppNamesFromManifests } from "../lib/AppManifest";
import { DOCUMENTS } from "../lib/constants";

export const deauthorizeApp = async () => {
    const manifests = await ALWorkspace.pickFolders("to deauthorize");
    if (!manifests) {
        return;
    }

    const success = await Git.instance.executeCleanOperation({
        manifests,
        operation: async manifest => {
            output.log(`Deauthorizing app "${manifest.name}" id ${manifest.id}`, LogLevel.Info);

            if (!manifest.ninja.config.authKey) {
                UI.authorization.showNotAuthorizedWarning(manifest);
                return false;
            }

            Telemetry.instance.log("deauthorize", manifest.id);
            let response = await Backend.deauthorizeApp(
                manifest.id,
                manifest.ninja.config.authKey || "",
                async response => {
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
                }
            );

            if (!response) {
                return false;
            }

            manifest.ninja.config.authKey = "";
            UI.authorization.showDeauthorizationSuccessfulInfo(manifest);
            return true;
        },
        getFilesToStage: () => [CONFIG_FILE_NAME],
        learnMore: () => showDocument(DOCUMENTS.AUTHORIZATION_GIT),
        getCommitMessage: manifests =>
            `AL Object ID Ninja app deauthorization for ${getAppNamesFromManifests(manifests)}`,
    });

    if (success) {
        AuthorizationStatusBar.instance.updateStatusBar();
    }
};
