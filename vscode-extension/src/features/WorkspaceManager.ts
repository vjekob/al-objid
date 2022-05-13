import { Disposable, workspace, WorkspaceFolder, WorkspaceFoldersChangeEvent } from "vscode";
import { ALApp } from "../lib/ALApp";

export class WorkspaceWatcher implements Disposable {
    private static _instance: WorkspaceWatcher;
    private _disposed = false;
    private _workspaceFoldersChangeEvent: Disposable;
    private _apps: ALApp[] = [];

    private constructor() {
        this._workspaceFoldersChangeEvent = workspace.onDidChangeWorkspaceFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
        this.addFoldersToWatch((workspace.workspaceFolders || []) as WorkspaceFolder[]);
    }

    public static get instance(): WorkspaceWatcher {
        return this._instance || (this._instance = new WorkspaceWatcher());
    }

    private onDidChangeWorkspaceFolders({ added, removed }: WorkspaceFoldersChangeEvent) {
        // Remove any ALApp instances that are no longer in workspace
        this._apps = this._apps.filter(app => {
            const stillExists = !removed.find(folder => app.isFolder(folder));
            if (!stillExists) {
                app.dispose();
            }
            return stillExists;
        });

        // Add any folders that are added to the workspace
        this.addFoldersToWatch(added as WorkspaceFolder[]);
    }

    private addFoldersToWatch(folders: WorkspaceFolder[]) {
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
