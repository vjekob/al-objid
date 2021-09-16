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

        let regex = /^(?<current>\*)?\s*(?<name>.+?)\s+(?<sha>.+?)(\s\[(?<tracks>.+)\])?\s+(?<message>.+)$/gm;
        let raw = [];
        let match;
        while (match = regex.exec(output)) raw.push(match);
        let branches: GitBranchInfo[] = raw.map(branch => ({
            name: branch.groups!.name,
            tracks: branch.groups!.tracks,
            current: !!branch.groups!.current,
        }));

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
}

// TODO: the following block:
/*

Allow synchronization only if folder is clean
For each branch where local tracks remote check `git status --branch --porcelain` to see if it's ahead or behind.
For each branch that's ahead or behind, ask user if (s)he wants to use local or remote.
For each remote branch that's being synced, use `git branch <some_random_string> --track <origin/name>`

*/