import { commands, Uri, window } from "vscode";
import { ALWorkspace } from "./ALWorkspace";
import { AppManifest, getManifest } from "./AppManifest";
import { Git } from "./Git";
import { CONFIG_FILE_NAME } from "./ObjIdConfig";
import { UI } from "./UI";
import path = require("path");
import { LABELS } from "./constants";

export namespace authorization {
    interface AuthorizationContext {
        uri: Uri;
        manifest: AppManifest;
    }

    const getBranchOptions = (branch: string) => ({
        YES: `Yes, please commit to the ${branch} branch`,
        NO: "No, I'll select another branch and then retry",
    });

    async function confirmBranchName(branch: string): Promise<boolean> {
        const options = getBranchOptions(branch);
        let result = await window.showQuickPick(Object.values(options), {
            placeHolder: `Do you want to commit to the ${branch} branch?`
        });
        return result === options.YES;
    }

    export async function getAuthorizationContext(): Promise<AuthorizationContext | undefined> {
        let uri = await ALWorkspace.selectWorkspaceFolder();
        if (!uri) {
            UI.general.showNoWorkspacesOpenInfo();
            return;
        }

        const manifest = getManifest(uri)!;

        if (!await Git.instance.isInitialized(uri)) {
            if (await UI.authorization.showNotGitRepoWarning(manifest) === LABELS.BUTTON_LEARN_MORE) {
                showAuthorizationGitDoc();
            } 
            return;
        }

        if (!await Git.instance.isClean(uri)) {
            if (await UI.authorization.showGitNotCleanWarning(manifest) === LABELS.BUTTON_LEARN_MORE) {
                showAuthorizationGitDoc();
            }
            return;
        }

        const branch = await Git.instance.getCurrentBranchName(uri);

        if (!branch) {
            if (await UI.authorization.showNoCurrentBranch() === LABELS.BUTTON_LEARN_MORE) {
                showAuthorizationGitDoc();
            };
            return;
        }

        if (!await confirmBranchName(branch)) {
            return;
        }

        return { uri, manifest };
    }

    export async function commitAuthorization(uri: Uri, operation: string) {
        await Git.instance.stageFile(uri, CONFIG_FILE_NAME);
        await Git.instance.commit(uri, `Changing AL Object ID Ninja app authorization (${operation})`);
    }

    function showDocument(document: string) {
        commands.executeCommand("markdown.showPreview", Uri.file(path.join(__dirname, `../../docs/${document}.md`)));
    }

    export function showAuthorizedDoc() {
        showDocument("authorized");
    }

    export function showAuthorizationGitDoc() {
        showDocument("authorization-git");
    }

    export function showAuthorizationDeletedDoc() {
        showDocument("authorization-deleted");
    }

    export function showAuthorizationBranchChangeDoc() {
        showDocument("authorization-branch-change");
    }
}
