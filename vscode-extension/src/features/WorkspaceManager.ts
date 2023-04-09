import { Disposable, EventEmitter, Uri, window, workspace, WorkspaceFolder, WorkspaceFoldersChangeEvent } from "vscode";
import { ALApp } from "../lib/ALApp";
import { PropertyBag } from "../lib/types/PropertyBag";
import { QuickPickWrapper } from "../lib/QuickPickWrapper";
import { UI } from "../lib/UI";
import { ALFoldersChangedEvent } from "../lib/types/ALFoldersChangedEvent";

export class WorkspaceManager implements Disposable {
    private static _instance: WorkspaceManager;
    private readonly _appMap: PropertyBag<ALApp> = {};
    private readonly _appHashMap: PropertyBag<ALApp> = {};
    private readonly _onDidChangeALFolders = new EventEmitter<ALFoldersChangedEvent>();
    public readonly onDidChangeALFolders = this._onDidChangeALFolders.event;
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
        const alRemoved: ALApp[] = [];
        this._apps = this._apps.filter(app => {
            const stillExists = !removed.find(folder => app.isFolder(folder));
            if (!stillExists) {
                alRemoved.push(app);
                delete this._appMap[app.uri.fsPath];
                delete this._appHashMap[app.hash];
            }
            return stillExists;
        });
        this._folders = this._folders.filter(
            oldFolder => !removed.find(removedFolder => removedFolder.uri.fsPath === oldFolder.uri.fsPath)
        );

        // Add any folders that are added to the workspace
        const alAdded: ALApp[] = [];
        this.addFoldersToWatch(added as WorkspaceFolder[], alAdded);

        // Fire the event with any AL Apps added or removed
        if (alRemoved.length || alAdded.length) {
            this._onDidChangeALFolders.fire({ added: alAdded, removed: alRemoved });
        }

        // Dispose of removed apps
        for (let app of alRemoved) {
            app.dispose();
        }
    }

    private addFoldersToWatch(folders: WorkspaceFolder[], addedApps?: ALApp[]) {
        for (let folder of folders) {
            const app = ALApp.tryCreate(folder);
            if (!app) {
                continue;
            }
            this._folders.push(folder);
            this._apps.push(app);
            this._appMap[app.uri.fsPath] = app;
            this._appHashMap[app.hash] = app;
            addedApps?.push(app);
        }
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

    /**
     * Shows a quick-pick menu that allows the user to pick a single app from the list of open apps. Auto-selects the
     * app if there is only one app in the workspace (in that case, the quick-pick menu is not shown).
     * @param operationDescription Description of the operation, to show in the quick-pick menu
     * @returns Promise to either selected app, or undefined
     */
    public pickFolder(operationDescription?: string): Promise<ALApp | undefined> {
        return this.pickFolderOrFolders(false, operationDescription) as Promise<ALApp | undefined>;
    }

    /**
     * Shows a quick-pick menu that allows the user to pick multiple apps from the list of open apps. Auto-selects
     * the app if there is only one app in the workspace (in that case, the quick-pick menu is not shown).
     * @param operationDescription Description of the operation to show in the quick-pick menu
     * @returns Promise to either array of selected apps, or undefined
     */
    public pickFolders(operationDescription?: string): Promise<ALApp[] | undefined> {
        return this.pickFolderOrFolders(true, operationDescription) as Promise<ALApp[] | undefined>;
    }

    /**
     * Returns the `ALApp` instance to which the specified Uri belongs. If Uri is not specified, then it attempts to read it
     * from the currently open document. If that document doesn't belong to an AL app, then the quick-pick menu is shown and
     * the user is asked to select a single folder.
     * @param uri Uri of the file or folder to select
     * @returns Promise to either selected app, or undefined
     */
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

    // TODO This function belongs to the ALApp class. Move it there.
    /**
     * Returns app pool ID that specified app identified by hash belongs to. If the app does not exist, or does not belong
     * to a pool, then the same passed as `appHash` parameter is returned.
     * @param appHash Hash of the app for which the app pool is being determined
     * @returns Pool ID of the pool, if the specified hash belongs to a pool; otherwise the app hash is returned
     */
    getPoolIdFromAppIdIfAvailable(appHash: string): string {
        const app = this.getALAppFromHash(appHash);
        if (!app) {
            return appHash;
        }
        const { appPoolId } = app.config;
        if (!appPoolId) {
            return appHash;
        }

        if (appPoolId.length !== 64 || !/[0-9A-Fa-f]{6}/g.test(appPoolId)) {
            UI.pool.showInvalidAppPoolIdError(app);
            return appHash;
        }

        return appPoolId;
    }

    /**
     * From Disposable.
     *
     * **Do not call directly.**
     */
    public dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._workspaceFoldersChangeEvent.dispose();
    }
}
