import { Uri } from "vscode";
import { DOCUMENTS, LABELS, CONFIG_FILE_NAME } from "../lib/constants";
import { getAppNames } from "../lib/functions/getAppNames";
import { showDocument } from "../lib/functions/showDocument";
import { Git } from "../lib/Git";
import { getSha256 } from "../lib/functions/getSha256";
import { UI } from "../lib/UI";
import { WorkspaceManager } from "../features/WorkspaceManager";
import { ALApp } from "../lib/ALApp";

export const createAppPool = async () => {
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
};

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
        getCommitMessage: apps => `AL Object ID Ninja pool creation (preview) for ${getAppNames(apps)}`,
    });
}

function createAppPoolIdFromAppId(app: ALApp): string {
    // This one intentionally accesses the original id!
    return getSha256(`al-objid.${app.manifest.id}.${Date.now()}`);
}
