import { InputBoxValidationSeverity, Uri, window } from "vscode";
import { DOCUMENTS, LABELS, CONFIG_FILE_NAME } from "../lib/constants";
import { getAppNames } from "../lib/functions/getAppNames";
import { showDocument } from "../lib/functions/showDocument";
import { Git } from "../lib/Git";
import { getSha256 } from "../lib/functions/getSha256";
import { UI } from "../lib/UI";
import { WorkspaceManager } from "../features/WorkspaceManager";
import { ALApp } from "../lib/ALApp";
import { featureFlags } from "../flags";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

// TODO Add telemetry here and EVERYWHERE!
// There can't be a command that doesn't log telemetry!
export const createAppPool = async (simple: boolean | undefined) => {
    if (!featureFlags.managedPools) {
        simple = true;
    }

    Telemetry.instance.logCommand(NinjaCommand.CreateAppPool, { simple });

    if (simple === undefined) {
        simple = await shouldCreateSimplePool();
        if (simple === undefined) {
            return;
        }
    }

    switch (simple) {
        case true:
            await createSimplePool();
            break;

        case false:
            await createManagedPool();
            break;
    }
};

async function createSimplePool() {
    const apps = WorkspaceManager.instance.alApps;
    if (apps.length === 0) {
        await UI.general.showNoWorkspacesOpenInfo();
        return;
    }

    if (apps.length === 1) {
        await createAppPoolForSingleApp(apps[0].uri);
    } else {
        await createAppPoolForMultipleApps(apps.map(folder => folder.uri));
    }
}

async function createManagedPool() {
    const name = await getPoolName();
    if (name === undefined) {
        return;
    }

    const managementSecret = await getSecret("Management secret", "Specify the secret to manage this pool");
    if (managementSecret === undefined) {
        return;
    }

    let managementSecretConfirmed: string | undefined;
    while (true) {
        managementSecretConfirmed = await confirmSecret(
            "Please, confirm the management secret",
            managementSecret,
            managementSecretConfirmed
        );
        if (managementSecretConfirmed === undefined) {
            return;
        }

        if (managementSecretConfirmed === managementSecret) {
            break;
        }
    }

    const joinSecret = await getSecret("Join secret", "Specify the secret other workspaces can use to join this pool");
    if (joinSecret === undefined) {
        return;
    }

    let joinSecretConfirmed: string | undefined;
    while (true) {
        joinSecretConfirmed = await confirmSecret("Please, confirm the join secret", joinSecret, joinSecretConfirmed);
        if (joinSecretConfirmed === undefined) {
            return;
        }

        if (joinSecretConfirmed === joinSecret) {
            break;
        }
    }

    let manageFromAnyApp = await confirmManageFromAnyApp();
}

async function shouldCreateSimplePool(): Promise<boolean | undefined> {
    const options = {
        simple: "Create a simple pool",
        managed: "Create a managed pool",
        learnMore: LABELS.BUTTON_LEARN_MORE,
    };
    const answer = await window.showQuickPick(Object.values(options), {
        canPickMany: false,
        ignoreFocusOut: true,
        title: "What kind of a pool would you like to create?",
    });
    switch (answer) {
        case options.simple:
            return true;

        case options.managed:
            return false;

        case options.learnMore:
            // TODO Show document about app pools
            return undefined;
    }
}

async function getPoolName(): Promise<string | undefined> {
    return await window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Pool name",
        title: "What do you want to call the pool?",
    });
}

async function getSecret(placeHolder: string, title: string): Promise<string | undefined> {
    return await window.showInputBox({
        ignoreFocusOut: true,
        placeHolder,
        password: true,
        title,
    });
}

async function confirmSecret(title: string, secret: string, value?: string): Promise<string | undefined> {
    return await window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Confirm the secret",
        password: true,
        title,
        prompt: value && "The secrets you provided did not match, please try again",
        value,
        validateInput: secretConfirmed => {
            if (secretConfirmed === secret) {
                return {
                    message: "$(check) The secrets match",
                    severity: InputBoxValidationSeverity.Info,
                };
            }
            if (value || secretConfirmed.length >= secret.length) {
                return {
                    message: "$(close) The secrets do not match",
                    severity: InputBoxValidationSeverity.Error,
                };
            }
            return undefined;
        },
    });
}

async function confirmManageFromAnyApp() {
    const options = {
        yes: "Yes. Allow any app in this pool to manage this pool.",
        no: "No. Allow only this workspace to manage the pool.",
        learnMore: LABELS.BUTTON_LEARN_MORE,
    };
    const answer = await window.showQuickPick(Object.values(options), {
        canPickMany: false,
        ignoreFocusOut: false,
        title: "Do you want to allow other apps to manage this pool?",
    });
    switch (answer) {
        case options.yes:
            return true;

        case options.no:
            return false;

        case options.learnMore:
            // TODO Show document about app pools
            return undefined;
    }
}

function prerequisitesMet(app: ALApp): boolean {
    if (app.config.appPoolId) {
        UI.pool.showAppAlreadyInPoolError(app).then(result => {
            if (result === LABELS.BUTTON_LEARN_MORE) {
                showDocument(DOCUMENTS.APP_POOLS);
            }
        });
        return false;
    }

    if (app.config.authKey) {
        UI.pool.showAppAuthorizedError(app).then(result => {
            if (result === LABELS.BUTTON_LEARN_MORE) {
                showDocument(DOCUMENTS.APP_POOLS);
            }
        });
        return false;
    }

    return true;
}

async function createAppPoolForSingleApp(uri: Uri) {
    const app = WorkspaceManager.instance.getALAppFromUri(uri)!;
    if (!prerequisitesMet(app)) {
        return;
    }

    app.config.appPoolId = createAppPoolIdFromAppId(app);
}

async function createAppPoolForMultipleApps(uris: Uri[]) {
    const apps = await WorkspaceManager.instance.pickFolders("to include in the pool");
    if (!apps || apps.length === 0) {
        return;
    }

    for (let app of apps) {
        if (!prerequisitesMet(app)) {
            return;
        }
    }

    const poolId = createAppPoolIdFromAppId(apps[0]);

    Git.instance.executeCleanOperation({
        apps,
        operation: async app => {
            app.config.appPoolId = poolId;
            return true;
        },
        getFilesToStage: () => [CONFIG_FILE_NAME],
        learnMore: () => showDocument(DOCUMENTS.APP_POOLS),
        getCommitMessage: apps => `AL Object ID Ninja simple pool creation for ${getAppNames(apps)}`,
    });
}

function createAppPoolIdFromAppId(app: ALApp): string {
    // This one intentionally accesses the original id!
    return getSha256(`al-objid.${app.manifest.id}.${Date.now()}`);
}
