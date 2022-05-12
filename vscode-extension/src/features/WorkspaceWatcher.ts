import { Disposable, workspace } from "vscode";
import { ALApp } from "../lib/ALApp";
import { ALWorkspace } from "../lib/ALWorkspace";
import { __AppManifest_obsolete_ } from "../lib/types";

/*

Idea: provide a central place to monitor changes in the workspace and feed information to other features

- Keep an eye on every workspace folder
- Context variable that indicates whether there is any AL folder, all features are off if there are no AL folders
- Whenever workspace folders change, update watches

- one app manifest is always one object reference!!
- one config file is always one object reference!!

*/
export class WorkspaceWatcher implements Disposable {
    private static _instance: WorkspaceWatcher;
    private _disposed = false;
    private _workspaceFoldersChangeEvent: Disposable;
    private _apps: ALApp[] = [];

    private constructor() {
        this._workspaceFoldersChangeEvent = workspace.onDidChangeWorkspaceFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
        this.setUpWatchersAtStartup();
    }

    public static get instance(): WorkspaceWatcher {
        return this._instance || (this._instance = new WorkspaceWatcher());
    }

    private onDidChangeWorkspaceFolders() {
        let folders = workspace.workspaceFolders || [];

        // TODO Remove any manifests that are no longer in workspace
        // TODO Update folders that have been in workspace
        // TODO Add folders that haven't been in workspace
    }

    private setUpWatchersAtStartup() {
        let folders = workspace.workspaceFolders || [];
        for (let folder of folders) {
            const app = ALApp.tryCreate(folder);
            if (!app) {
                continue;
            }
            this._apps.push(app);
        }
    }

    public dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._workspaceFoldersChangeEvent.dispose();
    }
}
