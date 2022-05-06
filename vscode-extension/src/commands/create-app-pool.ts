import { Uri } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getAppNamesFromManifests, getManifest } from "../lib/AppManifest";
import { DOCUMENTS, LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions";
import { Git } from "../lib/Git";
import { CONFIG_FILE_NAME } from "../lib/ObjIdConfig";
import { getSha256 } from "../lib/Sha256";
import { AppManifest } from "../lib/types";
import { UI } from "../lib/UI";

export const createAppPool = async () => {
    const folders = ALWorkspace.getALFolders();
    if (!folders || folders.length === 0) {
        await UI.general.showNoWorkspacesOpenInfo();
        return;
    }

    if (folders.length === 1) {
        await createAppPoolForSingleApp(folders[0].uri);
    } else {
        await createAppPoolForMultipleApps(folders.map(folder => folder.uri));
    }
};

function prerequisitesMet(manifest: AppManifest): boolean {
    if (manifest.ninja.config.appPoolId) {
        UI.pool.showAppAlreadyInPoolError(manifest).then(result => {
            if (result === LABELS.BUTTON_LEARN_MORE) {
                showDocument(DOCUMENTS.APP_POOLS);
            }
        });
        return false;
    }

    if (manifest.ninja.config.authKey) {
        UI.pool.showAppAuthorizedError(manifest).then(result => {
            if (result === LABELS.BUTTON_LEARN_MORE) {
                showDocument(DOCUMENTS.APP_POOLS);
            }
        });
        return false;
    }

    return true;
}

async function createAppPoolForSingleApp(uri: Uri) {
    const manifest = getManifest(uri)!;
    if (!prerequisitesMet(manifest)) {
        return;
    }

    manifest.ninja.config.appPoolId = createAppPoolIdFromAppId(manifest);
}

async function createAppPoolForMultipleApps(uris: Uri[]) {
    const manifests = await ALWorkspace.pickFolders("to include in the pool");
    if (!manifests || manifests.length === 0) {
        return;
    }

    for (let manifest of manifests) {
        if (!prerequisitesMet(manifest)) {
            return;
        }
    }

    const poolId = createAppPoolIdFromAppId(manifests[0]);

    Git.instance.executeCleanOperation({
        manifests,
        operation: async manifest => {
            manifest.ninja.config.appPoolId = poolId;
            return true;
        },
        getFilesToStage: () => [CONFIG_FILE_NAME],
        learnMore: () => showDocument(DOCUMENTS.APP_POOLS),
        getCommitMessage: manifests =>
            `AL Object ID Ninja pool creation (preview) for ${getAppNamesFromManifests(manifests)}`,
    });
}

function createAppPoolIdFromAppId(manifest: AppManifest): string {
    return getSha256(`al-objid.${manifest.ninja.unsafeOriginalId}.${Date.now()}`);
}
