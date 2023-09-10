import { window } from "vscode";
import { LogLevel, Output } from "../features/Output";
import { NinjaALRange } from "./types/NinjaALRange";
import { CONFIG_FILE_NAME, EXTENSION_NAME, LABELS } from "./constants";
import { EventLogEntry } from "./types/EventLogEntry";
import { ALApp } from "./ALApp";

// TODO All "learn more" messages should wrap their learn more action to reduce complexity of consumers

const CONSTANTS = {
    BACKEND: {
        CANNOT_COMMUNICATE: "Cannot communicate with the back-end API.",
    },

    AUTHORIZATION: {
        INCORRECT_KEY: "The authorization key you have provided is incorrect.",
        CANNOT_DEAUTHORIZE: "You cannot deauthorize app",
    },
};

const wrapInPool = (app: ALApp, description: string) =>
    app.config.appPoolId ? `pool to which ${description} belongs` : description;

const describeApp = (app: ALApp) =>
    wrapInPool(
        app,
        app.name.trim().toLowerCase() === app.manifest.name.trim().toLowerCase()
            ? app.manifest.name
            : `${app.manifest.name} (in folder ${app.name})`
    );

export const UI = {
    general: {
        showNoWorkspacesOpenInfo: () => window.showInformationMessage("There are no AL folders open. Nothing to do."),
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
        showSuccessInfo: (app?: ALApp) =>
            window.showInformationMessage(
                `Object IDs${app ? ` for ${describeApp(app)}` : ""} are now in sync with the Azure back end.`
            ),
        showInitialSuccessInfo: (app: ALApp) =>
            window.showInformationMessage(`That's it, no more object ID conflicts in ${app.name}.`),
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
        showNoBackEndConsumptionInfo: async (app: ALApp) =>
            window.showInformationMessage(
                `We see that you have AL Object ID Ninja installed. Would you like it to assign unique object IDs for you?`,
                LABELS.BUTTON_INITIAL_YES,
                LABELS.BUTTON_INITIAL_NO,
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
                LABELS.NO
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

    assignment: {
        showNotUpdatedError: async (type: string, id: number) =>
            window.showErrorMessage(
                `We could not update the object ID for ${type} ${id}. It seems that somebody on your team has just assigned it to another object.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showInteractiveNoOverlapError: async (app: ALApp, type: string) =>
            window.showErrorMessage(
                `The range you have selected does not overlap with any of the existing ranges configured in your ${
                    app.config.objectRanges[type]
                        ? `.objidconfig file ${type} ranges`
                        : app.config.idRanges.length
                        ? ".objidconfig file idRanges"
                        : "app manifest"
                }.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        reclaimId: async (type: string, id: number) =>
            window.showInformationMessage(
                `Are you sure that ${type} ${id} is really available and not actually in use by another local or remote branch?`,
                LABELS.YES,
                LABELS.NO,
                LABELS.BUTTON_LEARN_MORE
            ),
        reconfirmReclaimId: async (type: string, id: number) =>
            window.showInformationMessage(
                `Call us extra careful, but are you really sure that ${type} ${id} is really no longer in use by another local or remote branch?`,
                LABELS.YES,
                LABELS.NO,
                LABELS.BUTTON_LEARN_MORE
            ),
        reclaimSucceeded: async (type: string, id: number) =>
            window.showInformationMessage(
                `Object ID ${type} ${id} has been successfully reclaimed. It is now free for assignment to another object.`
            ),
        reclaimFailed: async (type: string, id: number) =>
            window.showErrorMessage(
                `We could not reclaim object ID ${type} ${id}. This is an unexpected error, please try again.`
            ),
    },

    git: {
        showNotRepoWarning: (app: ALApp, operation: string) =>
            window.showWarningMessage(
                `There is no Git repository for application ${describeApp(
                    app
                )}. You cannot ${operation} for an app unless you use Git to track it.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showNotCleanWarning: async (app: ALApp, operation: string) =>
            window.showWarningMessage(
                `Git repository for application ${describeApp(
                    app
                )} is not clean. Please commit, stash, or undo your changes before ${operation}."`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showNoCurrentBranchError: async (name: string) =>
            window.showErrorMessage(
                `We could not detect your current branch for ${name}. This can happen if you use an old version of Git or if your repository is in detached head state. Please, make sure to use latest version of Git, or to check out to an actual branch, and then retry.`,
                LABELS.BUTTON_LEARN_MORE
            ),
    },

    authorization: {
        showAlreadyAuthorizedError: async (app: ALApp) =>
            window.showErrorMessage(
                `Application ${describeApp(
                    app
                )} is already authorized. You must first deauthorize it if you want to authorize it again.`
            ),
        showIncorrectKeyWarning: (app: ALApp) =>
            window.showWarningMessage(
                `${CONSTANTS.AUTHORIZATION.INCORRECT_KEY} ${CONSTANTS.AUTHORIZATION.CANNOT_DEAUTHORIZE} ${describeApp(
                    app
                )}.`
            ),
        showNotAuthorizedWarning: (app: ALApp) =>
            window.showWarningMessage(
                `${CONSTANTS.AUTHORIZATION.CANNOT_DEAUTHORIZE} ${describeApp(app)} because it is not authorized.`
            ),
        showAuthorizationSuccessfulInfo: (app: ALApp) =>
            window.showInformationMessage(
                `You have successfully authorized app ${describeApp(
                    app
                )} and we have committed it to your local Git repository. Please, push your changes to remote and create a pull request (if necessary) to share the authorization key with other developers on your team.`
            ),
        showDeauthorizationSuccessfulInfo: (app: ALApp) =>
            window.showInformationMessage(
                `You have successfully deauthorized app ${describeApp(
                    app
                )}. Please make sure that ${CONFIG_FILE_NAME} file is present in the root folder of your app.`
            ),
        showDeletedAuthorizationError: (name: string) =>
            window.showErrorMessage(
                `Authorization file for ${name} was just deleted, and the app is still authorized. Please, make sure you understand the consequences.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showUnauthorizedBranchWarning: (name: string) =>
            window.showWarningMessage(
                `Current branch of ${name} does not contain a valid authorization key. You won't be able to assign new object IDs.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showManualModificationWarning: (name: string) =>
            window.showWarningMessage(
                `Your authorization key for ${name} is no longer valid. Please, undo your changes to ${CONFIG_FILE_NAME} as soon as posible. Until you do, you won't be able to assign new object IDs.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showAppIdChangedWarning: (name: string) =>
            window.showWarningMessage(
                `You have changed the app id for ${name}. It now probably contains a stale authorization key. Please, check the authKey property in ${CONFIG_FILE_NAME}.`,
                LABELS.BUTTON_LEARN_MORE
            ),
    },

    ranges: {
        showLogicalRangesExistConfirmation: (app: ALApp) =>
            window.showQuickPick(Object.values(LABELS.COPY_RANGES_ARE_YOU_SURE), {
                placeHolder: `Logical ranges are already defined for ${describeApp(
                    app
                )}. Do you want to overwrite them?`,
            }),
        showNoLogicalRangesMessage: (app: ALApp) =>
            window.showInformationMessage(
                `No logical ranges are defined for ${describeApp(app)}. There is nothing to consolidate.`
            ),
        showRangesConsolidatedMessage: (app: ALApp) =>
            window.showInformationMessage(
                `Logical ranges for ${describeApp(app)} are now consolidated in .objidconfig.`
            ),
        showInvalidRangeFromToError: (range: NinjaALRange) =>
            window.showErrorMessage(
                `Range ${
                    range.description
                        ? `${range.description} (${range.from}..${range.to})`
                        : `${range.from}..${range.to}`
                } has "to" lower than "from". "from" must be lower, and "to" must be higher.`,
                LABELS.FIX
            ),
    },

    pool: {
        showInvalidAppPoolIdError: (app: ALApp) =>
            window.showErrorMessage(
                `App Pool ID defined in .objidconfig for ${describeApp(
                    app
                )} is invalid. Please make sure to only use pool IDs created using the appropriate Ninja command.`
            ),
        showAppAuthorizedError: (app: ALApp) =>
            window.showErrorMessage(
                `App ${describeApp(
                    app
                )} is authorized. Pools manage their own authorization, so only unauthorized apps can be included in app pools.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showAppAlreadyInPoolError: (app: ALApp) =>
            window.showErrorMessage(
                `App ${describeApp(app)} already belongs to a pool. One app can belong to only one pool.`,
                LABELS.BUTTON_LEARN_MORE
            ),
    },

    license: {
        showNoLicenseMessage: (app: ALApp) =>
            window.showInformationMessage(
                `There is no license configured for ${describeApp(app)}, there is nothing to validate.`,
                LABELS.BUTTON_LEARN_MORE
            ),
        showInvalidLicenseError: () =>
            window.showWarningMessage(`This is not a valid license file.`, LABELS.BUTTON_LEARN_MORE),
        noLicenseFilesFound: (app: ALApp) =>
            window.showWarningMessage(`We could not find any license files in ${describeApp(app)}.`),
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
