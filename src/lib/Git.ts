import { exec, ExecException, ExecOptions } from "child_process";
import { Uri } from "vscode";

export interface GitBranchInfo {
    name: string;
    remoteName: string;
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

    public async isInitialized(uri: Uri): Promise<boolean> {
        let result = await this.execute("status --porcelain", uri);
        return !!result;
    }

    public async branches(uri: Uri): Promise<GitBranchInfo[] | null> {
        let result = await this.execute("branch --all -vv", uri, false) as string;
        if (!result) return null;
        let matches = /^(?<current>\*)?\s*(?<name>.+?)\s+(?<sha>.+?)(\s\[(?<remote>.+)\])?\s+(?<message>.+)$/gm.exec(result);
        // continue here
        return [];
    }
}
