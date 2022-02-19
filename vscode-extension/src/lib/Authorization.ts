import { commands, Uri, window } from "vscode";
import { ALWorkspace } from "./ALWorkspace";
import { AppManifest, getManifest } from "./AppManifest";
import { Git } from "./Git";
import { CONFIG_FILE_NAME } from "./ObjIdConfig";
import { UI } from "./UI";
import path = require("path");

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
            UI.authorization.showNotGitRepoWarning(manifest);
            return;
        }

        if (!await Git.instance.isClean(uri)) {
            UI.authorization.showGitNotCleanWarning(manifest);
            return;
        }

        const branch = await Git.instance.getCurrentBranchName(uri);

        if (!branch) {
            UI.authorization.showNoCurrentBranch(manifest);
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

    export function showAuthorizedDoc() {
        commands.executeCommand("markdown.showPreview", Uri.file(path.join(__dirname, `../../docs/authorized.md`)));
    }
}
