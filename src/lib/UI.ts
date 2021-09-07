import { window } from "vscode";
import { EXTENSION_NAME } from "./constants";

const CONSTANTS = {
    BACKEND: {
        CANNOT_COMMUNICATE: "Cannot communicate with the back-end API.",
        USE_LATEST: ` Make sure you are using the latest version of ${EXTENSION_NAME} extension or manually configure the API endpoint.`,
    },

    SYNC: {
        NOTHING_TO_SYNC: "There is nothing to synchronize."
    }
}
export const UI = {
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
        showNoWorkspacesOpenInfo: () =>
            window.showInformationMessage(`There are no workspaces open. ${CONSTANTS.SYNC.NOTHING_TO_SYNC}`),
        showNoManifestError: () =>
            window.showErrorMessage(`There is no app.json file in this workspace. ${CONSTANTS.SYNC.NOTHING_TO_SYNC}`),
        showSuccessInfo: () =>
            window.showInformationMessage("Object IDs are now in sync with the Azure back end. Happy developing!")
    },

    nextId: {
        showNoBackEndConsumptionInfo: () =>
            window.showInformationMessage("Azure back end has no information about consumed object IDs. Do you want to synchronize?", "Synchronize"),
    }
}
