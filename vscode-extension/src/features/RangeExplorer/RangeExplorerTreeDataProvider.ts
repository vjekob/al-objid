import { ExplorerDecorationsProvider } from "./ExplorerDecorationsProvider";
import { Disposable, EventEmitter, TreeDataProvider, TreeItem, Uri, workspace } from "vscode";
import { ALWorkspace } from "../../lib/ALWorkspace";
import { getCachedManifestFromUri, getManifest } from "../../lib/AppManifest";
import { ALRange } from "../../lib/types";
import { TextTreeItem } from "../Explorer/TextTreeItem";
import { INinjaTreeItem, NinjaTreeItem } from "../Explorer/NinjaTreeItem";
import { getFolderTreeItemProvider } from "./TreeItemProviders";

// TODO Display any "no consumption yet" (and similar) nodes grayed out
// Also, propagate this decoration to their parents

// TODO When editing .objidconfig or app.json, refresh range explorer

// TODO Show individual IDs in range explorer, title = object id, description = file path
// When clicking on object id, opens the document and selects that id
// For any object consumed not by this repo, indicate with a different color that it comes from another repo
// For any such object, add commands:
// - "Investigate": checks if the object is in another branch, and if not, adds an "investigation token" in
//                  the back end that every other user will pick up and report back if they have this object
//                  in their repos, and if not, back end reports back and indicates that this object id is
//                  probably safe to release. For this we SHOULD keep name, date, time, of every object id
//                  assignment made through Ninja
// - "Release":     releases the ID in the back end and makes it available for re-assignment

export class RangeExplorerTreeDataProvider implements TreeDataProvider<INinjaTreeItem>, Disposable {
    public static _instance: RangeExplorerTreeDataProvider;

    private constructor() {
        this.setUpWatchers();
        this._workspaceFoldersChangeEvent = workspace.onDidChangeWorkspaceFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
    }

    public static get instance() {
        return this._instance || (this._instance = new RangeExplorerTreeDataProvider());
    }

    private _workspaceFoldersChangeEvent: Disposable;
    private _watchers: Disposable[] = [];
    private _disposed: boolean = false;

    private _onDidChangeTreeData = new EventEmitter<INinjaTreeItem | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private onDidChangeWorkspaceFolders() {
        this.disposeWatchers();
        this.setUpWatchers();
        this.refresh();
    }

    private setUpWatchers() {
        let folders = ALWorkspace.getALFolders();
        if (!folders) {
            return;
        }
        for (let folder of folders) {
            const manifest = getManifest(folder.uri)!;

            const watcherAppId = workspace.createFileSystemWatcher(manifest.ninja.path);
            watcherAppId.onDidChange(e => this.refresh(e));
            this._watchers.push(watcherAppId);

            const watcherObjIdConfig = workspace.createFileSystemWatcher(
                `${manifest.ninja.config.path}`
            );
            watcherObjIdConfig.onDidChange(e => this.refresh(e));
            this._watchers.push(watcherObjIdConfig);
        }
    }

    getTreeItem(element: INinjaTreeItem): TreeItem | Promise<TreeItem> {
        return element.getTreeItem();
    }

    getChildren(element?: INinjaTreeItem): INinjaTreeItem[] | Promise<INinjaTreeItem[]> {
        if (!element) {
            let folders = ALWorkspace.getALFolders();
            if (!folders) {
                return [
                    new TextTreeItem(
                        "No AL workspaces are open.",
                        "There is nothing to show here",
                        undefined
                    ),
                ];
            }

            folders = folders.filter(
                folder => !getCachedManifestFromUri(folder.uri).ninja.config.appPoolId
            );
            if (!folders) {
                return [
                    new TextTreeItem(
                        "Only app pools available.",
                        "There is nothing to show here",
                        undefined
                    ),
                ];
            }
            return folders?.map(folder => {
                const manifest = getManifest(folder.uri)!;
                const folderItem = new NinjaTreeItem(
                    manifest,
                    getFolderTreeItemProvider(manifest, item => {
                        this._onDidChangeTreeData.fire(item);
                    })
                );
                this._watchers.push(folderItem);
                return folderItem;
            });
        }

        return element.children;
    }

    public getUriString(appId: string, range?: ALRange, objectType?: string): string {
        let result = `ninja://range/${appId}`;
        if (range) {
            result = `${result}/${range.from}-${range.to}`;
        }
        if (objectType) {
            result = `${result}/${objectType}`;
        }
        return result;
    }

    refresh(uri?: Uri) {
        if (uri) {
            const manifest = getManifest(uri);
            if (manifest) {
                ExplorerDecorationsProvider.instance.releaseDecorations(manifest);
            }
        }
        this._onDidChangeTreeData.fire();
    }

    private disposeWatchers() {
        for (let disposable of this._watchers) {
            disposable.dispose();
        }
        this._watchers = [];
    }

    dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.disposeWatchers();
        this._workspaceFoldersChangeEvent.dispose();
    }
}
