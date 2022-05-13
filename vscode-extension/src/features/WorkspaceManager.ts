import { Disposable, Uri, window, workspace, WorkspaceFolder, WorkspaceFoldersChangeEvent } from "vscode";
import { ALApp } from "../lib/ALApp";
import { PropertyBag } from "../lib/PropertyBag";
import { QuickPickWrapper } from "../lib/QuickPickWrapper";
import { UI } from "../lib/UI";

export class WorkspaceManager implements Disposable {
    private static _instance: WorkspaceManager;
    private readonly _appMap: PropertyBag<ALApp> = {};
    private readonly _appHashMap: PropertyBag<ALApp> = {};
    private _apps: ALApp[] = [];
    private _folders: WorkspaceFolder[] = [];
    private _disposed = false;
    private _workspaceFoldersChangeEvent: Disposable;

    private constructor() {
        this._workspaceFoldersChangeEvent = workspace.onDidChangeWorkspaceFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
        this.addFoldersToWatch((workspace.workspaceFolders || []) as WorkspaceFolder[]);
    }

    public static get instance(): WorkspaceManager {
        return this._instance || (this._instance = new WorkspaceManager());
    }

    private onDidChangeWorkspaceFolders({ added, removed }: WorkspaceFoldersChangeEvent) {
        // Remove any ALApp instances that are no longer in workspace
        this._apps = this._apps.filter(app => {
            const stillExists = !removed.find(folder => app.isFolder(folder));
            if (!stillExists) {
                delete this._appMap[app.uri.fsPath];
                delete this._appHashMap[app.hash];
                app.dispose();
            }
            return stillExists;
        });
        this._folders = this._folders.filter(
            oldFolder => !removed.find(removedFolder => removedFolder.uri.fsPath === oldFolder.uri.fsPath)
        );

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
            this._appMap[app.uri.fsPath] = app;
            this._appHashMap[app.hash] = app;
        }
        this._folders.push(...folders);
    }

    private async pickFolderOrFolders(multi: boolean, description?: string): Promise<ALApp[] | ALApp | undefined> {
        if (this._folders.length === 0) {
            UI.general.showNoWorkspacesOpenInfo();
            return;
        }

        if (this._folders.length === 1) {
            const app = this.getALAppFromUri(this._folders[0].uri)!;
            return multi ? [app] : app;
        }

        let quickPick = new QuickPickWrapper<ALApp>(
            this._folders.map(folder => {
                let app = this.getALAppFromUri(folder.uri)!;
                return {
                    label: folder.name,
                    detail: `$(folder) ${folder.uri.fsPath}`,
                    description: `${app.manifest.name} (${app.manifest.version})`,
                    data: app,
                };
            })
        );
        quickPick.placeholder = multi
            ? `Choose AL workspace folders${description ? ` ${description}` : ""}...`
            : `Select an AL workspace folder${description ? ` ${description}` : ""}...`;
        quickPick.ignoreFocusOut = multi;

        let result = await (multi ? quickPick.pickMany() : quickPick.pickOne());
        if (!result) return undefined;
        return result;
    }

    /**
     * Checks if a Uri belongs to an AL app folder. The Uri does not need to be the root of an AL folder, but
     * simply has to belong to an AL folder (e.g. a file in a subfolder hierarchy of an AL app).
     *
     * @param uri Uri to check
     */
    public isALUri(uri: Uri): boolean {
        const root = workspace.getWorkspaceFolder(uri);
        if (!root) {
            return false;
        }
        return !!this._folders.find(folder => folder.uri.fsPath === root.uri.fsPath);
    }

    /**
     * Gets an array of all AL apps.
     */
    public get alApps(): ALApp[] {
        return [...this._apps];
    }

    /**
     * This function returns the ALApp instance to which the specified Uri belongs, or undefined if the Uri does not
     * belong to any ALApp.
     * @param uri Uri for which ALApp is to be returned
     * @returns ALApp for the Uri
     */
    public getALAppFromUri(uri: Uri): ALApp | undefined {
        // If the specified Uri is the root, we can find the app quicker
        const folder = this._appMap[uri.fsPath];
        if (folder) {
            return folder;
        }

        // Let's find the root to which this file belongs, and then try to find the app for it
        const rootUri = workspace.getWorkspaceFolder(uri);
        if (!rootUri) {
            return;
        }

        return this._appMap[rootUri.uri.fsPath];
    }

    /**
     * Looks up the ALApp instance with the specified hash.
     * @param hash Hash of the app ID to look up
     * @returns ALApp instance matching the hash, or undefined if not found
     */
    public getALAppFromHash(hash: string): ALApp | undefined {
        return this._appHashMap[hash];
    }

    public pickFolder(operationDescription?: string): Promise<ALApp | undefined> {
        return this.pickFolderOrFolders(false, operationDescription) as Promise<ALApp | undefined>;
    }

    public pickFolders(operationDescription?: string): Promise<ALApp[] | undefined> {
        return this.pickFolderOrFolders(true, operationDescription) as Promise<ALApp[] | undefined>;
    }

    public async selectWorkspaceFolder(uri?: Uri): Promise<ALApp | undefined> {
        if (uri && this.isALUri(uri)) {
            return this.getALAppFromUri(uri);
        }

        uri = window.activeTextEditor?.document.uri;
        if (uri && this.isALUri(uri)) {
            return this.getALAppFromUri(uri);
        }

        return this.pickFolder();
    }

    public dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._workspaceFoldersChangeEvent.dispose();
    }
}
