import { window } from "vscode";
import { Output } from "../features/Output";
import { AppManifest } from "./AppManifest";
import { CONFIG_FILE_NAME } from "./ObjIdConfig";
import { EXTENSION_NAME, LABELS } from "./constants";
import { EventLogEntry } from "./BackendTypes";

const CONSTANTS = {
    BACKEND: {
        CANNOT_COMMUNICATE: "Cannot communicate with the back-end API.",
    },

    SYNC: {
        NOTHING_TO_SYNC: "There is nothing to synchronize."
    },

    AUTHORIZATION: {
        INCORRECT_KEY: "The authorization key you have provided is incorrect.",
        CANNOT_DEAUTHORIZE: "You cannot deauthorize app"
    }
};

export const UI = {
    general: {
        showNoWorkspacesOpenInfo: () =>
            window.showInformationMessage("There are no AL folders open. Nothing to do."),
        showReleaseNotes: (version: string) =>
            window.showInformationMessage(`AL Object ID Ninja has been updated to version ${version}. Happy developing!`,
                LABELS.BUTTON_SHOW_RELEASE_NOTES),
    },
    
    backend: {
        showEndpointNotFoundError: (endpoint: string, isDefault: boolean) => {
            let message = CONSTANTS.BACKEND.CANNOT_COMMUNICATE;
            message += isDefault
                ? ` Make sure you are using the latest version of ${EXTENSION_NAME} extension or manually configure the API endpoint.`
                : " Make sure the API is available at the configured endpoint.";

            message += `\n\nEndpoint: ${endpoint}`;
            window.showErrorMessage(message);
        },
        showEndpointUnauthorizedError: (isDefault: boolean) => {
            let message = CONSTANTS.BACKEND.CANNOT_COMMUNICATE;
            message += isDefault
                ? " Your app authorization key may be missing or wrong, or your API key may be misconfigured."
                : " Make sure your API key is valid."
            window.showErrorMessage(message);
        }
    },

    sync: {
        showNoManifestError: () =>
            window.showErrorMessage(`There is no app.json file in this workspace. ${CONSTANTS.SYNC.NOTHING_TO_SYNC}`),
        showSuccessInfo: () =>
            window.showInformationMessage("Object IDs are now in sync with the Azure back end. Happy developing!"),
        showAreYouSure: async () =>
            window.showQuickPick(Object.values(LABELS.SYNC_ARE_YOU_SURE), {
                placeHolder: "Are you sure you want to replace existing object ID assignments?"
            }),
        showRepoNotClean: (name: string) =>
            window.showWarningMessage(
                `Repository ${name} is dirty or has staged content. To perform automatic synchronization, all your repositories must be clean.`,
                "OK",
                LABELS.BUTTON_LEARN_MORE),
        showHowToAutoSync: async () =>
            window.showQuickPick(Object.values(LABELS.AUTO_SYNC_PICK), {
                placeHolder: "How do you want to auto-sync your workspace?"
            }),
    },

    nextId: {
        showNoBackEndConsumptionInfo: async (name: string) =>
            window.showInformationMessage(
                `Azure back end has no information about consumed object IDs for ${name}. Do you want to synchronize?`,
                LABELS.BUTTON_SYNCHRONIZE,
                "No",
                LABELS.BUTTON_LEARN_MORE),
        showNoMoreNumbersWarning: async () =>
            window.showWarningMessage("No more numbers are available for assignment. Do you want to synchronize?", LABELS.BUTTON_SYNCHRONIZE, "No"),
        showNoBackEndConsumptionInfoAlreadySaidNo: async () =>
            window.showInformationMessage(
                "You have already clicked 'No' for another app. Would you like to...",
                LABELS.BUTTON_DONT_ASK,
                "Keep reminding me for each app"
            ),
    },

    authorization: {
        showAlreadyAuthorizedWarning: async (manifest: AppManifest) =>
            window.showWarningMessage(`Application "${manifest.name}" is already authorized. Do you want to re-authorize it?`, "Yes", "No"),
        showReauthorizedInfo: (manifest: AppManifest) =>
            window.showInformationMessage(`You have re-authorized app "${manifest.name}". Please make sure to share your authorization file with your team members to avoid disruption of service.`),
        showIncorrectKeyWarning: (manifest: AppManifest) =>
            window.showWarningMessage(`${CONSTANTS.AUTHORIZATION.INCORRECT_KEY} ${CONSTANTS.AUTHORIZATION.CANNOT_DEAUTHORIZE} "${manifest.name}".`),
        showNotAuthorizedWarning: (manifest: AppManifest) =>
            window.showWarningMessage(`${CONSTANTS.AUTHORIZATION.CANNOT_DEAUTHORIZE} "${manifest.name}" because it is not authorized.`),
        showNoKeyError: (manifest: AppManifest) =>
            window.showErrorMessage(`You do not have an authorization key configured for app "${manifest.name}". Please make sure that ${CONFIG_FILE_NAME} file is present in the root folder of your app.`),
        showAuthorizationSuccessfulInfo: (manifest: AppManifest) =>
            window.showInformationMessage(`You have successfully authorized app "${manifest.name}". Please commit the ${CONFIG_FILE_NAME} file to your repository or otherwise share it with your team members as soon as possible.`),
        showDeauthorizationSuccessfulInfo: (manifest: AppManifest) =>
            window.showInformationMessage(`You have successfully deauthorized app "${manifest.name}".`),
        showDeauthorizationFailedWarning: (manifest: AppManifest, error: string) =>
            window.showWarningMessage(`An error occurred while deleting the authorization file for app "${manifest.name}": ${error}`)
    },

    log: {
        showMessage: (event: EventLogEntry, appName: string) => {
            let message = "";
            switch (event.eventType) {
                case "authorize":
                    message = `${event.user} authorized ${appName}.`;
                    break;
                case "deauthorize":
                    message = `${event.user} authorized ${appName}.`;
                    break;
                case "getNext":
                    message = `${event.user} created ${event.data.type} ${event.data.id} in ${appName}.`;
                    break;
                case "syncFull":
                    message = `${event.user} performed full synchronization for ${appName}.`;
                    break;
                case "syncMerge":
                    message = `${event.user} performed update synchronization for ${appName}.`;
                    break;
            }
            if (!message) {
                return;
            }
            Output.instance.log(message);
            window.showInformationMessage(message)
        },
    }
}
