import { window } from "vscode";
import { LogLevel, Output } from "../features/Output";
import { __AppManifest_obsolete_, NinjaALRange } from "./types";
import { CONFIG_FILE_NAME, EXTENSION_NAME, LABELS } from "./constants";
import { EventLogEntry } from "./BackendTypes";

const CONSTANTS = {
    BACKEND: {
        CANNOT_COMMUNICATE: "Cannot communicate with the back-end API.",
    },

    AUTHORIZATION: {
        INCORRECT_KEY: "The authorization key you have provided is incorrect.",
        CANNOT_DEAUTHORIZE: "You cannot deauthorize app",
    },
};

export const UI = {
    general: {
        showNoWorkspacesOpenInfo: () =>
            window.showInformationMessage("There are no AL folders open. Nothing to do."),
        showReleaseNotes: (version: string) =>
            window.showInformationMessage(
                `AL Object ID Ninja has been updated to version ${version}.`,
                LABELS.BUTTON_SHOW_RELEASE_NOTES
            ),
        showReleaseNotesNotAvailable: (version: string) =>
            window.showInformationMessage(`Release notes are not available for version ${version}`),
        showBackEndConfigurationError: () =>
            window.showErrorMessage(
                "IMPORTANT! You are using a self-hosted back end but you have not configured the polling back-end URL. Your AL Object ID Ninja may not work correctly or may not work at all.",
                LABELS.BUTTON_LEARN_MORE
            ),
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
                : " Make sure your API key is valid.";
            window.showErrorMessage(message);
        },
    },

    sync: {
        showSuccessInfo: (manifest?: __AppManifest_obsolete_) =>
            window.showInformationMessage(
                `Object IDs${
                    manifest ? ` for ${manifest.name}` : ""
                } are now in sync with the Azure back end.`
            ),
        showAreYouSure: async () =>
            window.showQuickPick(Object.values(LABELS.SYNC_ARE_YOU_SURE), {
                placeHolder: "Are you sure you want to replace existing object ID assignments?",
            }),
        showRepoNotClean: (name: string) =>
            window.showWarningMessage(
                `Repository ${name} is dirty or has staged content. To perform automatic synchronization, all your repositories must be clean.`,
                "OK",
                LABELS.BUTTON_LEARN_MORE
            ),
        showHowToAutoSync: async () =>
            window.showQuickPick(Object.values(LABELS.AUTO_SYNC_PICK), {
                placeHolder: "How do you want to auto-sync your workspace?",
            }),
    },

    nextId: {
        showNoBackEndConsumptionInfo: async (name: string) =>
            window.showInformationMessage(
                `Azure back end has no information about consumed object IDs for ${name}. Do you want to synchronize?`,
                LABELS.BUTTON_SYNCHRONIZE,
                "No",
                LABELS.BUTTON_LEARN_MORE
            ),
        showNumbersAboutToRunOut: (name: string, type: string, remaining: number) =>
            window.showWarningMessage(
                `Only ${remaining} IDs remain for ${type} objects in ${name} app.`,
                "OK",
                LABELS.BUTTON_DONT_SHOW_AGAIN
            ),
        showDisabledOnlyForAppAndType: (name: string, type: string) =>
            window.showInformationMessage(
                `This warning is now disabled for ${type} objects in ${name} app. You will keep seeing it for other object types and other apps. If you want to disable it completely, switch off the "Show Range Warnings" configuration setting.`,
                "OK"
            ),
        showNoMoreNumbersWarning: async () =>
            window.showWarningMessage(
                "No more numbers are available for assignment. Do you want to synchronize?",
                LABELS.BUTTON_SYNCHRONIZE,
                "No"
            ),
        showNoBackEndConsumptionInfoAlreadySaidNo: async () =>
            window.showInformationMessage(
                "You have already clicked 'No' for another app. Would you like to...",
                LABELS.BUTTON_DONT_ASK,
                "Keep reminding me for each app"
            ),
        showNoMoreInLogicalRangeWarning: async (name: string) =>
            window.showWarningMessage(
                `No more numbers are available in logical range ${name} that you selected. Please retry with a different range, or reconfigure your logical ranges to include more numbers in the ${name} range.`,
                LABELS.BUTTON_LEARN_MORE
            ),
    },

    git: {
        showNotRepoWarning: (manifest: __AppManifest_obsolete_, operation: string) =>
            window.showWarningMessage(
                `There is no Git repository for application "${manifest.name}. You cannot ${operation} for an app unless you use Git to track it.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showNotCleanWarning: async (manifest: __AppManifest_obsolete_, operation: string) =>
            window.showWarningMessage(
                `Git repository for application "${manifest.name}" is not clean. Please commit, stash, or undo your changes before ${operation}."`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showNoCurrentBranchError: async (name: string) =>
            window.showErrorMessage(
                `We could not detect your current branch for ${name}. This can happen if you use an old version of Git or if your repository is in detached head state. Please, make sure to use latest version of Git, or to check out to an actual branch, and then retry.`,
                LABELS.BUTTON_LEARN_MORE
            ),
    },

    authorization: {
        showAlreadyAuthorizedError: async (manifest: __AppManifest_obsolete_) =>
            window.showErrorMessage(
                `Application "${manifest.name}" is already authorized. You must first deauthorize it if you want to authorize it again.`
            ),
        showIncorrectKeyWarning: (manifest: __AppManifest_obsolete_) =>
            window.showWarningMessage(
                `${CONSTANTS.AUTHORIZATION.INCORRECT_KEY} ${CONSTANTS.AUTHORIZATION.CANNOT_DEAUTHORIZE} "${manifest.name}".`
            ),
        showNotAuthorizedWarning: (manifest: __AppManifest_obsolete_) =>
            window.showWarningMessage(
                `${CONSTANTS.AUTHORIZATION.CANNOT_DEAUTHORIZE} "${manifest.name}" because it is not authorized.`
            ),
        showNoKeyError: (manifest: __AppManifest_obsolete_) =>
            window.showErrorMessage(
                `You do not have an authorization key configured for app "${manifest.name}". Please make sure that ${CONFIG_FILE_NAME} file is present in the root folder of your app.`
            ),
        showAuthorizationSuccessfulInfo: (manifest: __AppManifest_obsolete_) =>
            window.showInformationMessage(
                `You have successfully authorized app "${manifest.name}" and we have committed it to your local Git repository. Please, push your changes to remote and create a pull request (if necessary) to share the authorization key with other developers on your team.`
            ),
        showDeauthorizationSuccessfulInfo: (manifest: __AppManifest_obsolete_) =>
            window.showInformationMessage(
                `You have successfully deauthorized app "${manifest.name}". Please make sure that ${CONFIG_FILE_NAME} file is present in the root folder of your app.`
            ),
        showDeauthorizationFailedWarning: (manifest: __AppManifest_obsolete_, error: string) =>
            window.showWarningMessage(
                `An error occurred while deleting the authorization file for app "${manifest.name}": ${error}`
            ),
        showDeletedAuthorization: (manifest: __AppManifest_obsolete_) =>
            window.showErrorMessage(
                `Authorization file for ${manifest.name} was just deleted, and the app is still authorized. Please, make sure you understand the consequences.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showUnauthorizedBranch: (branch: string, manifest: __AppManifest_obsolete_) =>
            window.showWarningMessage(
                `The ${branch} branch of ${manifest.name} does not contain authorization file and you won't be able to assign new object IDs.`,
                LABELS.BUTTON_LEARN_MORE
            ),
    },

    ranges: {
        showLogicalRangesExistConfirmation: (manifest: __AppManifest_obsolete_) =>
            window.showQuickPick(Object.values(LABELS.COPY_RANGES_ARE_YOU_SURE), {
                placeHolder: `Logical ranges are already defined for ${manifest.name}. Do you want to overwrite them?`,
            }),
        showNoLogicalRangesMessage: (manifest: __AppManifest_obsolete_) =>
            window.showInformationMessage(
                `No logical ranges are defined for ${manifest.name}. There is nothing to consolidate.`
            ),
        showRangeFullyRepresentedMessage: (manifest: __AppManifest_obsolete_) =>
            window.showInformationMessage(
                `All ranges in app.json for ${manifest.name} are represented as logical ranges in .objidconfig.`
            ),
        showRangesConsolidatedMessage: (manifest: __AppManifest_obsolete_) =>
            window.showInformationMessage(
                `Logical ranges for ${manifest.name} are now consolidated in .objidconfig.`
            ),
        showInvalidRangeFromToError: (name: string, range: NinjaALRange) =>
            window.showErrorMessage(
                `Range ${
                    range.description
                        ? `${range.description} (${range.from}..${range.to})`
                        : `${range.from}..${range.to}`
                } in ${name} has "to" lower than "from". "from" must be lower, and "to" must be higher.`,
                LABELS.FIX
            ),
        showInvalidRangeTypeError: (name: string, range: NinjaALRange) =>
            window.showErrorMessage(
                `Logical range ${
                    range.description
                        ? `${range.description} (${range.from}..${range.to})`
                        : `${range.from}..${range.to}`
                } in ${name} is invalid. Both "from" and "to" must be non-zero numbers.`,
                "OK"
            ),
        showRangeOverlapError: (name: string, range1: NinjaALRange, range2: NinjaALRange) =>
            window.showErrorMessage(
                `Ranges logical ranges ${
                    range1.description
                        ? `${range1.description} (${range1.from}..${range1.to})`
                        : `${range1.from}..${range1.to}`
                } and ${
                    range2.description
                        ? `${range2.description} (${range2.from}..${range2.to})`
                        : `${range2.from}..${range2.to}`
                } in ${name} overlap. Until you fix this issue, your logical range configuration in .objidconfig will be ignored.`,
                "OK"
            ),
    },

    pool: {
        showInvalidAppPoolIdError: (manifest: __AppManifest_obsolete_) =>
            window.showErrorMessage(
                `App Pool ID defined in .objidconfig for ${manifest.name} is invalid. Please make sure to only use pool IDs created using the appropriate Ninja command.`
            ),
        showAppAuthorizedError: (manifest: __AppManifest_obsolete_) =>
            window.showErrorMessage(
                `App ${manifest.name} is authorized. Pools manage their own authorization, so only unauthorized apps can be included in app pools.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showAppAlreadyInPoolError: (manifest: __AppManifest_obsolete_) =>
            window.showErrorMessage(
                `App ${manifest.name} already belongs to a pool. One app can belong to only one pool.`,
                LABELS.BUTTON_LEARN_MORE
            ),
    },

    license: {
        showNoLicenseMessage: (manifest: __AppManifest_obsolete_) =>
            window.showInformationMessage(
                `There is no license configured for ${manifest.name}, there is nothing to validate.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showInvalidLicenseError: () =>
            window.showWarningMessage(
                `This is not a valid license file.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        noLicenseFilesFound: (manifest: __AppManifest_obsolete_) =>
            window.showWarningMessage(`We could not find any license files in ${manifest.name}.`),
    },

    log: {
        showMessage: (event: EventLogEntry, appName: string) => {
            if (!event || !event.user) {
                return;
            }
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
            Output.instance.log(message, LogLevel.Info);
            window.showInformationMessage(message);
        },
    },
};
