import { window } from "vscode";
import { AppManifest } from "./AppManifest";
import { EXTENSION_NAME, LABELS } from "./constants";

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
            window.showInformationMessage("Object IDs are now in sync with the Azure back end. Happy developing!")
    },

    nextId: {
        showNoBackEndConsumptionInfo: async () =>
            window.showInformationMessage("Azure back end has no information about consumed object IDs. Do you want to synchronize?", LABELS.BUTTON_SYNCHRONIZE, "No"),
        showNoMoreNumbersWarning: async () =>
            window.showWarningMessage("No more numbers are available for assignment. Do you want to synchronize?", LABELS.BUTTON_SYNCHRONIZE, "No"),
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
            window.showErrorMessage(`You do not have an authorization key configured for app "${manifest.name}". Please make sure that .objidauth file is present in the root folder of your app.`),
        showAuthorizationSuccessfulInfo: (manifest: AppManifest) =>
            window.showInformationMessage(`You have successfully authorized app "${manifest.name}". Please commit the .objidauth file to your repository or otherwise share it with your team members as soon as possible.`),
        showDeauthorizationSuccessfulInfo: (manifest: AppManifest) =>
            window.showInformationMessage(`You have successfully deauthorized app "${manifest.name}".`),
        showDeauthorizationFailedWarning: (manifest: AppManifest, error: string) =>
            window.showWarningMessage(`An error occurred while deleting the authorization file for app "${manifest.name}": ${error}`)
    }
}
