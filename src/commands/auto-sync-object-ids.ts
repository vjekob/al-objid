import { extensions, ProgressLocation, Uri, window, workspace } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { ConsumptionInfo } from "../lib/BackendTypes";
import { LABELS } from "../lib/constants";
import { Git, GitBranchInfo } from "../lib/Git";
import { getObjectDefinitions, getWorkspaceFolderFiles, updateActualConsumption } from "../lib/ObjectIds";
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
            if (!branch.tracks) return "Local-only branch";
            if (branch.ahead === 0 && branch.behind === 0) return "Local and remote branches are in sync";
            if (branch.ahead) {
                let result = `Local is ahead of remote by ${branch.ahead} commit(s)`;
                if (branch.behind) result += ` and behind it by ${branch.behind} commits`;
                return result;
            }
            if (branch.behind > 0) return `Local is behind remote by ${branch.behind} commit(s)`;
        } else {
            return "Remote-only branch";
        }
    },
    getChooseLocalText(branch: GitBranchInfo) {
        return branch.behind
            ? `omit ${branch.behind} remote commits`
            : `includes more information than remote`;
    },
    getChooseRemoteText(branch: GitBranchInfo) {
        return branch.ahead
            ? `omit ${branch.ahead} local commits`
            : `includes more information than local`;
    }
}

interface AutoSyncConfiguration {
    repo?: Uri;
    branchesLocal: string[];
    branchesRemote: string[];
    folders: Uri[];
}

function createNewConfig(repo?: Uri): AutoSyncConfiguration {
    return { repo, branchesLocal: [], branchesRemote: [], folders: [] };
}

function getRepoName(repo: Uri) {
    let parts = repo.path.split("/");
    return parts.length === 0
        ? repo.toString()
        : parts[parts.length - 1];
}

async function updateObjectDefinitions(uri: Uri, consumption: ConsumptionInfo) {
    const uris = await getWorkspaceFolderFiles(uri);
    const objects = getObjectDefinitions(uris);
    updateActualConsumption(objects, consumption);
}

async function syncFoldersForConfiguration(config: AutoSyncConfiguration, consumptions: PropertyBag<ConsumptionInfo>) {
    for (let folder of config.folders) {
        if (!consumptions[folder.fsPath]) consumptions[folder.fsPath] = {};
        await updateObjectDefinitions(folder, consumptions[folder.fsPath]);
    }
}

async function syncSingleConfiguration(config: AutoSyncConfiguration, consumptions: PropertyBag<ConsumptionInfo>) {
    const { repo, branchesLocal, branchesRemote } = config;
    if (repo) {
        let currentBranch = await Git.instance.getCurrentBranchName(repo);
        if (branchesLocal) {
            for (let branch of branchesLocal) {
                if (branch !== currentBranch) await Git.instance.checkout(repo, branch);
                await syncFoldersForConfiguration(config, consumptions);
                if (branch !== currentBranch) await Git.instance.checkout(repo, currentBranch);
            }
        }
        if (branchesRemote) {
            for (let branch of branchesRemote) {
                let newBranch = `al-object-id-ninja-remote/${Date.now()}/${branch}`;
                await Git.instance.trackRemoteBranch(repo, branch, newBranch);
                await Git.instance.checkout(repo, newBranch);

                await syncFoldersForConfiguration(config, consumptions);

                await Git.instance.checkout(repo, currentBranch);
                await Git.instance.deleteBranch(repo, newBranch);
            }
        }
        return;
    }

    await syncFoldersForConfiguration(config, consumptions)
}

function compressConsumption(consumption: ConsumptionInfo) {
    for (let key of Object.keys(consumption)) {
        consumption[key] = [...new Set(consumption[key])].sort();
    }
}

function compressConsumptions(consumptions: PropertyBag<ConsumptionInfo>) {
    for (let key of Object.keys(consumptions)) {
        compressConsumption(consumptions[key]);
    }
}

export const autoSyncObjectIds = async () => {
    await window.withProgress({ location: ProgressLocation.Notification }, async progress => {
        if (!workspace.workspaceFolders || !workspace.workspaceFolders.length) {
            return;
        }

        const gitExtension = extensions?.getExtension('vscode.git')?.exports;
        const git = gitExtension?.getAPI(1);

        // 1. pick folders
        let folders = await ALWorkspace.pickFolder(true) as Uri[] | undefined;
        if (!folders || !folders.length) return;

        // 2. find git repos that match picked folders
        progress.report({ message: "Connecting to Git..." });
        let repos: Uri[] = [];
        let repoFolders: PropertyBag<Uri[]> = {};
        let setup: AutoSyncConfiguration[] = [];
        let nonGit = createNewConfig();
        setup.push(nonGit);
        for (let uri of folders) {
            let root = await Git.instance.getRepositoryRootUri(git, uri);
            if (!root) {
                nonGit.folders.push(uri);
                continue;
            }

            let repoPath = root.fsPath;
            if (!repoFolders[repoPath]) repoFolders[repoPath] = [];
            repoFolders[repoPath].push(uri);

            if (repos.find(repo => repo.fsPath === repoPath)) continue;

            if (!await Git.instance.isClean(root)) {
                if (await UI.sync.showRepoNotClean(getRepoName(root)) === LABELS.BUTTON_LEARN_MORE) {
                    // TODO: redirect to some page where auto-sync is explained
                }
                return;
            }
            repos.push(root);
        }

        // 3. Iterate through all repos to obtain branch information
        let branches: PropertyBag<GitBranchInfo[] | null> = {};
        let i = 0;
        for (let repo of repos) {
            progress.report({ message: `Fetching branch information for ${getRepoName(repo)} (${++i} of ${repos.length})...` });

            // a. Fetch
            await Git.instance.fetch(repo);

            // b. Obtain branches
            branches[repo.fsPath] = await Git.instance.branches(repo);
            if (branches === null) {
                // For some reason, repository reports no branches
                continue;
            }
        }

        // 4. Iterate through all repos and pick the branches
        for (let repo of repos) {
            let repoBranches = branches[repo.fsPath];
            if (repoBranches === null) continue;

            // c. Pick from list of branches
            if (repoBranches.length > 1) {
                progress.report({ message: "Waiting for your branches selection..." });
                let quickPick = new QuickPickWrapper<GitBranchInfo>(repoBranches.map((branch) => ({
                    label: BranchInfo.getName(branch),
                    detail: BranchInfo.getDetail(branch),
                    description: "",
                    data: branch
                })));
                quickPick.placeholder = `Which branches would you like to synchronize for ${getRepoName(repo)}?`;
                let picked = await quickPick.pickMany();
                if (!picked.length) continue;
                repoBranches = picked;
            }

            // d. For each branch, if local is ahead/behind, ask whether to use local, remote, or both (and also indicate how many commits is difference)
            let config: AutoSyncConfiguration = createNewConfig(repo);
            for (let branch of repoBranches) {
                progress.report({ message: `Progressing branch ${branch.name || branch.tracks} of ${getRepoName(repo)}` });
                if (branch.ahead || branch.behind) {
                    let picks = [
                        `Local (${BranchInfo.getChooseLocalText(branch)})`,
                        `Remote (${BranchInfo.getChooseRemoteText(branch)})`,
                    ];
                    if (branch.ahead && branch.behind) picks.push(`Both (includes all information from local and remote)`)
                    let choice = await window.showQuickPick(picks, { placeHolder: `How do you want to synchronize branch ${branch.name} of ${getRepoName(repo)}?` });
                    if (!choice) continue;
                    switch (choice.split(" ")[0]) {
                        case "Local":
                            config.branchesLocal.push(branch.name!);
                            break;
                        case "Remote":
                            config.branchesRemote.push(branch.tracks!);
                            break;
                        case "Both":
                            config.branchesRemote.push(branch.tracks!);
                            config.branchesLocal.push(branch.name!);
                            break;
                    }
                } else {
                    if (branch.name) {
                        // If local branch exists, then it's used even if remote exists
                        config.branchesLocal.push(branch.name);
                    } else {
                        // If local branch does not exist, then it's a remote branch and must be used
                        config.branchesRemote.push(branch.tracks!);
                    }
                }
            }
            config.folders = repoFolders[repo.fsPath];
            setup.push(config);
        }
        // e. Prepare a copy of each branch, checkout into it
        // e.2 foreach folder belonging in this repo do sync
        let consumptions: PropertyBag<ConsumptionInfo> = {};
        for (let config of setup) {
            progress.report({ message: `Syncing ${config.repo ? `repo ${getRepoName(config.repo)}` : "other folders"}...` })
            await syncSingleConfiguration(config, consumptions);
        }
        compressConsumptions(consumptions);
        debugger;
    });
};
