import { window } from "vscode";
import { EXTENSION_NAME, LABELS } from "./constants";

const CONSTANTS = {
    BACKEND: {
        CANNOT_COMMUNICATE: "Cannot communicate with the back-end API.",
        USE_LATEST: ` Make sure you are using the latest version of ${EXTENSION_NAME} extension or manually configure the API endpoint.`,
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
                ? CONSTANTS.BACKEND.USE_LATEST
                : " Make sure the API is available at the configured endpoint.";

            message += `\n\nEndpoint: ${endpoint}`;
            window.showErrorMessage(message);
        },
        showEndpointUnauthorizedError: (isDefault: boolean) => {
            let message = CONSTANTS.BACKEND.CANNOT_COMMUNICATE;
            message += isDefault
                ? CONSTANTS.BACKEND.USE_LATEST
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
        showAlreadyAuthorizedWarning: async (appId: string) =>
            window.showWarningMessage(`Application ${appId} is already authorized. Do you want to re-authorize it?`, "Yes", "No"),
        showReauthorizedInfo: (appId: string) =>
            window.showInformationMessage(`You have re-authorized app ${appId}. Please make sure to share your authorization file with your team members to avoid disruption of service.`),
        showIncorrectKeyWarning: (appId: string) =>
            window.showWarningMessage(`${CONSTANTS.AUTHORIZATION.INCORRECT_KEY} ${CONSTANTS.AUTHORIZATION.CANNOT_DEAUTHORIZE} ${appId}.`),
        showNotAuthorizedWarning: (appId: string) =>
            window.showWarningMessage(`${CONSTANTS.AUTHORIZATION.CANNOT_DEAUTHORIZE} ${appId} because it is not authorized.`),
        showNoKeyError: (appId: string) =>
            window.showErrorMessage(`You do not have an authorization key configured for app ${appId}. Please make sure that .objidauth file is present in the root folder of your app.`),
        showAuthorizationSuccessfulInfo: (appId: string) =>
            window.showInformationMessage(`You have successfully authorized app ${appId}. Please commit the .objidauth file to your repository or otherwise share it with your team members as soon as possible.`),
        showDeauthorizationSuccessfulInfo: (appId: string) =>
            window.showInformationMessage(`You have successfully deauthorized app ${appId}.`),
        showDeauthorizationFailedWarning: (appId: string, error: string) =>
            window.showWarningMessage(`An error occurred while deleting the authorization file for app ${appId}: ${error}`)
    }
}
