import { AuthorizationStatusBar } from "../features/AuthorizationStatusBar";
import { LogLevel, output } from "../features/Output";
import { Backend } from "../lib/Backend";
import { UI } from "../lib/UI";
import { Telemetry } from "../lib/Telemetry";
import { Git } from "../lib/Git";
import { ALWorkspace } from "../lib/ALWorkspace";
import { showDocument } from "../lib/functions";
import { getAppNamesFromManifests } from "../lib/__AppManifest_obsolete_";
import { CONFIG_FILE_NAME, DOCUMENTS } from "../lib/constants";

export const authorizeApp = async () => {
    const manifests = await ALWorkspace.pickFolders("to authorize");
    if (!manifests) {
        return;
    }

    const success = await Git.instance.executeCleanOperation({
        manifests,
        operation: async manifest => {
            output.log(`Authorizing app "${manifest.name}" id ${manifest.id}`, LogLevel.Info);

            Telemetry.instance.log("authorize", manifest.id);
            const gitUser = await Git.instance.getUserInfo(manifest.ninja.uri);
            let response = await Backend.authorizeApp(
                manifest.id,
                gitUser.name,
                gitUser.email,
                async response => {
                    const { error } = response;
                    if (error.statusCode !== 405) {
                        return false;
                    }

                    UI.authorization.showAlreadyAuthorizedError(manifest);
                    return true;
                }
            );

            if (!response || !response.authKey) {
                return false;
            }

            manifest.ninja.config.authKey = response.authKey;
            UI.authorization.showAuthorizationSuccessfulInfo(manifest);
            return true;
        },
        getFilesToStage: () => [CONFIG_FILE_NAME],
        learnMore: () => showDocument(DOCUMENTS.AUTHORIZATION_GIT),
        getCommitMessage: manifests =>
            `AL Object ID Ninja app authorization for ${getAppNamesFromManifests(manifests)}`,
    });

    if (success) {
        AuthorizationStatusBar.instance.updateStatusBar();
        showDocument(DOCUMENTS.AUTHORIZED);
    }
};
