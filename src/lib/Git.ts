import { exec } from "child_process";
import { Uri } from "vscode";

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
}

export class Git {
    //#region Singleton
    private static _instance: Git;
    private constructor() { }

    public static get instance(): Git {
        return this._instance || (this._instance = new Git());
    }
    //#endregion

    private async execute(command: string, uri: Uri, split = true): Promise<string[] | string | null> {
        return new Promise((resolve) => {
            exec(`git ${command}`, { cwd: uri.fsPath, windowsHide: true }, (error, stdout) => {
                if (error) {
                    resolve(null);
                    return;
                }

                if (!split) {
                    resolve(stdout);
                    return;
                }

                let parts = stdout.split(/[\r\n]+/gm);
                resolve(parts);
            });
        })
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

    public async getRepositoryRootUri(git: any, uri: Uri): Promise<Uri | undefined> {
        // If git extension is active, we can use it to obtain the results faster
        if (git) {
            let repo = git.getRepository(uri);
            if (!repo) return;
            return repo.rootUri;
        }

        // Git extension is not active, we must do this through raw git (which is substantially slower)
        let result = await this.execute("rev-parse --show-toplevel", uri, false) as string | undefined;
        if (!result) return;
        let repoUri = Uri.file(result.trim());
        return repoUri;
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
        let output = await this.execute("branch --all -vv", uri, false) as string;
        if (!output) return null;

        let regex = /^(?<current>\*)?\s*(?<name>.+?)\s+(?<sha>[a-f0-9]+?)(\s\[(?<tracks>.+?)(\:\s(?<position>ahead|behind)\s(?<count>\d+))?\])?\s+(?<message>.+)$/gm;
        let raw = [];
        let match;
        while (match = regex.exec(output)) raw.push(match);
        let branches: GitBranchInfo[] = raw.map(branch => {
            let ahead = 0;
            let { name, tracks, current, position, count } = branch.groups!;
            if (position) {
                ahead = parseInt(count);
                if (position === "behind") ahead = -ahead;
            }
            return {
                name,
                tracks,
                current: !!current,
                ahead,
            };
        });

        let result: GitBranchInfo[] = [];
        let tracked: any = {};
        // Pass 1: correct branch names and remote tracking
        for (let branch of branches) {
            if (branch.tracks) {
                tracked[branch.tracks] = true;
                continue;
            }
            if (branch.name!.startsWith("remotes/")) {
                branch.tracks = branch.name!.substring(8);
                branch.name = undefined;
            }
        }
        // Pass 2: exclude raw remote branches tracked by local
        for (let branch of branches) {
            if (!branch.name && branch.tracks && tracked[branch.tracks]) continue;
            result.push(branch);
        }
        return result;
    }

    public async getAheadBehind(uri: Uri): Promise<number | null> {
        let output = await this.execute("status --branch --porcelain", uri, false) as string | null;
        if (!output) return null;

        let match = output.trim().match(/^##.+\[(?<position>ahead|behind)\s(?<count>\d+)\]$/i);
        if (!match) return 0;

        let { count, position } = match.groups!;
        let result = parseInt(count);
        return position === "ahead" ? result : -result;
    }

    public async checkout(uri: Uri, branch: string): Promise<boolean> {
        let output = await this.execute(`checkout ${branch}`, uri, false);
        return output !== null;
    }
}

// TODO: the following block:
/*

Allow synchronization only if folder is clean
For each branch where local tracks remote check `git status --branch --porcelain` to see if it's ahead or behind.
For each branch that's ahead or behind, ask user if (s)he wants to use local or remote.
For each remote branch that's being synced, use `git branch <some_random_string> --track <origin/name>`

*/