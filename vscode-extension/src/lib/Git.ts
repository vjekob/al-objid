import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";
import { extensions, Uri, window } from "vscode";
import { LogLevel, output } from "../features/Output";
import { LABELS } from "./constants";
import { PropertyBag } from "./types/PropertyBag";
import { GitTopLevelPathContext } from "./types/GitTopLevelPathContext";
import { GitCleanOperationContext } from "./types/GitCleanOperationContext";
import { UI } from "./UI";
import { getAppNames } from "./functions/getAppNames";

/**
 * Represents a branch info with local and remote tracking info:
 * - Local branch that tracks a remote branch has both `name` and `tracks` set.
 * - Local branch that does not track a remote branch has `tracks` undefined.
 * - Remote branch that is not tracked by a local branch has `name` undefined.
 */
export interface GitBranchInfo {
    name?: string;
    tracks?: string;
    current: boolean;
    ahead: number;
    behind: number;
    sha?: string;
    shaRemote?: string;
    message: string;
}

export class Git {
    //#region Singleton
    private static _instance: Git;
    private constructor() {}

    public static get instance(): Git {
        return this._instance || (this._instance = new Git());
    }
    //#endregion

    private isDirectory(fsPath: string): boolean {
        if (!fs.existsSync(fsPath)) {
            return false;
        }

        try {
            const isDir = fs.lstatSync(fsPath).isDirectory();
            return isDir;
        } catch {
            return false;
        }
    }

    private async execute(command: string, uri: Uri, split = true): Promise<string[] | string | null> {
        const cwd = this.isDirectory(uri.fsPath) ? uri.fsPath : path.dirname(uri.fsPath);
        return new Promise(resolve => {
            const gitCommand = `git ${command}`;
            output.log(`[Git] Executing command: ${gitCommand}`, LogLevel.Verbose);
            exec(gitCommand, { cwd, windowsHide: true }, (error, stdout) => {
                if (error) {
                    output.log(`[Git] Error executing Git: ${error}`);
                    resolve(null);
                    return;
                }
                output.log(`[Git] Successfully executed command: ${gitCommand}`, LogLevel.Verbose);
                if (!split) {
                    resolve(stdout);
                    return;
                }

                let parts = stdout.split(/[\r\n]+/gm);
                resolve(parts);
            });
        });
    }

    /**
     * Checks if a folder belongs to a git repository. If `false` then git commands must not be executed
     * against that folder.
     *
     * @param uri Uri of the folder in which to execute the command
     * @returns Boolean indicating whether folder belongs to a git repository
     */
    public async isInitialized(uri: Uri): Promise<boolean> {
        let result = await this.execute("status --porcelain", uri);
        return result !== null;
    }

    /**
     * Checks if the repository to which a folder belongs is clean. If `false` then the user must receive a
     * warning. No git commands in AL Object ID Ninja are safe to execute on unclean folders.
     *
     * @param uri Uri of the folder in which to execute the command
     * @returns Boolean indicating whether the repository is clean
     */
    public async isClean(uri: Uri): Promise<boolean> {
        let result = await this.execute("status --porcelain", uri);
        return Array.isArray(result) && result.filter(line => line).length === 0;
    }

    public async commit(uri: Uri, message: string): Promise<void> {
        await this.execute(`commit -m "${message}"`, uri);
        return;
    }

    public async stageFile(uri: Uri, filePath: string): Promise<void> {
        await this.execute(`add ${filePath}`, uri);
        return;
    }

    public async getUserInfo(uri: Uri): Promise<{ name: string; email: string }> {
        const name = (((await this.execute("config user.name", uri, false)) as string) || "").trim();
        const email = (((await this.execute("config user.email", uri, false)) as string) || "").trim();
        return {
            name,
            email,
        };
    }

    public getGitAPI(): any {
        const gitExtension = extensions?.getExtension("vscode.git")?.exports;
        const git = gitExtension?.getAPI(1);
        return git;
    }

    public async getRepositoryRootUri(uri: Uri): Promise<Uri | undefined> {
        const git = this.getGitAPI();

        // If git extension is active, we can use it to obtain the results faster
        if (git) {
            let repo = git.getRepository(uri);
            if (!repo) return;
            return repo.rootUri;
        }

        // Git extension is not active, we must do this through raw git (which is slower)
        let result = await this.getTopLevelPath(uri);
        if (!result) return;
        let repoUri = Uri.file(result.trim());
        return repoUri;
    }

    public async getTopLevelPath(uri: Uri): Promise<string> {
        const topLevelPath = (await this.execute("rev-parse --show-toplevel", uri, false)) as string;
        return topLevelPath ? topLevelPath.trim() : "";
    }

    public async fetch(uri: Uri): Promise<boolean> {
        let result = await this.execute("fetch", uri, false);
        return result !== null;
    }

    /**
     * Returns all branches (local and remote) with their tracking information. Unlike the raw command, this
     * method will exclude any raw remote branches that are already included through a local branch that tracks
     * them.
     *
     * @param uri Uri of the folder in which to execute the command
     * @returns Array of GitBranchInfo if successful, null if error (means: not under git control)
     */
    public async branches(uri: Uri): Promise<GitBranchInfo[] | null> {
        let output = (await this.execute("branch --all -vv", uri, false)) as string;
        if (!output) return null;

        let regex =
            /^(?<current>\*)?\s*(?<name>.+?)\s+(?<sha>[a-f0-9]+?)\s(\[(?<tracks>.+?)\:?( ahead (?<ahead>\d+))?(\,? behind (?<behind>\d+))?\]\s)?(?<message>.+)$/gm;
        let raw = [];
        let match;
        while ((match = regex.exec(output))) raw.push(match);
        let branches: GitBranchInfo[] = raw.map(branch => {
            let { name, tracks, current, ahead, behind, sha, message } = branch.groups!;
            return {
                name,
                tracks,
                current: !!current,
                ahead: parseInt(ahead) | 0,
                behind: parseInt(behind) | 0,
                sha,
                message,
            };
        });

        let result: GitBranchInfo[] = [];
        let tracked: PropertyBag<boolean> = {};
        let remoteSha: PropertyBag<string> = {};
        // Pass 1: correct branch names and remote tracking
        for (let branch of branches) {
            if (branch.tracks) {
                tracked[branch.tracks] = true;
                continue;
            }
            if (branch.name!.startsWith("remotes/")) {
                branch.tracks = branch.name!.substring(8);
                branch.name = undefined;
                remoteSha[branch.tracks!] = branch.sha!;
                branch.shaRemote = branch.sha;
                branch.sha = undefined;
            }
        }
        // Pass 2: exclude raw remote branches tracked by local and update remote sha
        for (let branch of branches) {
            if (!branch.name && branch.tracks && tracked[branch.tracks]) continue;
            if (branch.name && branch.tracks) branch.shaRemote = remoteSha[branch.tracks];
            result.push(branch);
        }
        return result;
    }

    public async checkout(uri: Uri, branch: string): Promise<boolean> {
        let output = await this.execute(`checkout ${branch}`, uri, false);
        return output !== null;
    }

    public async getCurrentBranchName(uri: Uri): Promise<string> {
        let output = (await this.execute("branch --show-current", uri, false)) as string | undefined;
        return (output && output.trim()) || "";
    }

    public async deleteBranch(uri: Uri, branch: string): Promise<boolean> {
        let output = await this.execute(`branch -D ${branch}`, uri, false);
        return !!output;
    }

    public async trackRemoteBranch(uri: Uri, remoteBranch: string, newBranch: string): Promise<boolean> {
        let output = await this.execute(`branch ${newBranch} --track ${remoteBranch}`, uri, false);
        return !!output;
    }

    public async executeCleanOperation(context: GitCleanOperationContext): Promise<boolean> {
        const getBranchOptions = (branch: string) => ({
            YES: `Yes, please commit to the ${branch} branch`,
            NO: "No, I'll select another branch and then retry",
        });

        async function confirmBranchName(branch: string, names: string): Promise<boolean> {
            const options = getBranchOptions(branch);
            let result = await window.showQuickPick(Object.values(options), {
                placeHolder: `Do you want to commit to the ${branch} branch for ${names}?`,
            });
            return result === options.YES;
        }

        // First pass - require all uris to belong to clean git repos and get top-level paths
        const topLevelPaths: PropertyBag<GitTopLevelPathContext> = {};
        for (let app of context.apps) {
            if (!(await Git.instance.isInitialized(app.uri))) {
                if ((await UI.git.showNotRepoWarning(app, "change authorization")) === LABELS.BUTTON_LEARN_MORE) {
                    context.learnMore(context.apps);
                }
                return false;
            }

            if (!(await Git.instance.isClean(app.uri))) {
                if ((await UI.git.showNotCleanWarning(app, "authorizing the app")) === LABELS.BUTTON_LEARN_MORE) {
                    context.learnMore(context.apps);
                }
                return false;
            }

            const topLevelPath = await this.getTopLevelPath(app.uri);
            const topLevelPathInfo =
                topLevelPaths[topLevelPath] ||
                (topLevelPaths[topLevelPath] = {
                    uri: (await this.getRepositoryRootUri(app.uri))!,
                    apps: [],
                    branch: "",
                });
            topLevelPathInfo.apps.push(app);
        }

        // Second pass - confirm branch names for top-level Git directories
        for (let key of Object.keys(topLevelPaths)) {
            const topLevelPath = topLevelPaths[key];
            const names = getAppNames(topLevelPath.apps);

            const branch = await Git.instance.getCurrentBranchName(topLevelPath.uri);
            if (!branch) {
                if ((await UI.git.showNoCurrentBranchError(names)) === LABELS.BUTTON_LEARN_MORE) {
                    context.learnMore(topLevelPath.apps);
                }
                return false;
            }

            if (!(await confirmBranchName(branch, names))) {
                return false;
            }
        }

        let atLeastOneSucceeded = false;

        // Third pass - execute and commit
        for (let key of Object.keys(topLevelPaths)) {
            const topLevelPath = topLevelPaths[key];

            let commit = false;
            for (let app of topLevelPath.apps) {
                if (!(await context.operation(app))) {
                    // Operation signalled that nothing should be committed
                    continue;
                }

                // Stage files that need to be staged
                const files = context.getFilesToStage(app);
                for (let file of files) {
                    await this.stageFile(app.manifest.uri, file);
                }

                // Indicate that commit is needed for this top-level path
                commit = true;
            }

            // Commit files
            if (commit) {
                await this.commit(topLevelPath.uri, context.getCommitMessage(topLevelPath.apps));
                atLeastOneSucceeded = true;
            }
        }

        return atLeastOneSucceeded;
    }
}
