import { extensions, Uri, workspace } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { LABELS } from "../lib/constants";
import { Git, GitBranchInfo } from "../lib/Git";
import { PropertyBag } from "../lib/PropertyBag";
import { QuickPickWrapper } from "../lib/QuickPickWrapper";
import { UI } from "../lib/UI";

const BranchInfo = {
    getName(branch: GitBranchInfo) {
        let name = "";
        if (branch.name) {
            name = branch.name;
            if (branch.tracks) name += ` $(arrow-right) ${branch.tracks}`;
        } else {
            name = `${branch.tracks!}`;
        }
        return name;
    },
    getDetail(branch: GitBranchInfo) {
        if (branch.name) {
            if (!branch.tracks) return "Local only";
            if (branch.ahead === 0) return "Branches are in sync";
            return branch.ahead < 0
                ? `Local is behind remote by ${-branch.ahead} commit(s)`
                : `Local is ahead of remote by ${branch.ahead} commit(s)`;
        } else {
            return "Remote only";
        }
    }
}

export const autoSyncObjectIds = async () => {
    if (!workspace.workspaceFolders || !workspace.workspaceFolders.length) {
        return;
    }

    const gitExtension = extensions?.getExtension('vscode.git')?.exports;
    const git = gitExtension?.getAPI(1);

    // 1. pick folders
    let folders = await ALWorkspace.pickFolder(true) as Uri[] | undefined;
    if (!folders || !folders.length) return;

    // 2. find git repos that match picked folders
    let repos: Uri[] = [];
    let repoFolders: PropertyBag<Uri[]> = {};
    let nonGitFolders: Uri[] = [];
    for (let uri of folders) {
        let root = await Git.instance.getRepositoryRootUri(git, uri);
        if (!root) {
            nonGitFolders.push(uri);
            continue;
        }

        let repoPath = root.fsPath;
        if (!repoFolders[repoPath]) repoFolders[repoPath] = [];
        repoFolders[repoPath].push(uri);

        if (repos.find(repo => repo.fsPath === repoPath)) continue;

        if (!await Git.instance.isClean(root)) {
            let parts = root.path.split("/");
            if (await UI.sync.showRepoNotClean(parts[parts.length - 1]) === LABELS.BUTTON_LEARN_MORE) {
                // TODO: redirect to some page where auto-sync is explained
            }
            return;
        }
        repos.push(root);
    }

    // 3. Iterate through all repos first
    let failed: Uri[] = [];
    for (let repo of repos) {
        // a. Obtain branches
        let branches = await Git.instance.branches(repo);
        if (branches === null) {
            // For some reason, repository reports no branches
            failed.push(repo);
            continue;
        }

        // b. Pick from list of branches
        if (branches.length > 1) {
            let quickPick = new QuickPickWrapper<GitBranchInfo>(branches.map((branch) => ({
                label: BranchInfo.getName(branch),
                detail: BranchInfo.getDetail(branch),
                description: "",
                data: branch
            })));
            quickPick.placeholder = "Which branches would you like to synchronize?";
            branches = await quickPick.pickMany();
            if (!branches.length) continue;
        }

        // c. For each branch, if local is ahead/behind, ask whether to use local, remote, or both (and also indicate how many commits is difference)

        // c. Prepare a copy of each branch, checkout into it
        // c.2 foreach folder belonging in this repo do sync
    }
};
