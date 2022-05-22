import { ExplorerDecorationsProvider } from "../Explorer/ExplorerDecorationsProvider";
import { Disposable, EventEmitter, TreeItem, Uri } from "vscode";
import { TextTreeItem } from "../Explorer/TextTreeItem";
import { __obsolete_INinjaTreeItem_, __obsolete_NinjaTreeItem_ } from "../Explorer/__obsolete_NinjaTreeItem_";
import { getFolderTreeItemProvider } from "./__obsolete_TreeItemProviders_";
import { WorkspaceManager } from "../WorkspaceManager";
import { __obsolete_NinjaTreeDataProvider_ } from "../Explorer/__obsolete_NinjaTreeDataProvider_";
import { ExpandCollapseController } from "../Explorer/ExpandCollapseController";
import { ALFoldersChangedEvent } from "../../lib/types/ALFoldersChangedEvent";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { ALApp } from "../../lib/ALApp";

// TODO Display any "no consumption yet" (and similar) nodes grayed out
// Also, propagate this decoration to their parents

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

export class RangeExplorerTreeDataProvider implements __obsolete_NinjaTreeDataProvider_, Disposable {
    public constructor() {
        this.setUpWatchers();
        this._workspaceFoldersChangeEvent = WorkspaceManager.instance.onDidChangeALFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
    }

    private _workspaceFoldersChangeEvent: Disposable;
    private _expandCollapseController: ExpandCollapseController | undefined;
    private _watchersMap: PropertyBag<Disposable[]> = {};
    private _watchers: Disposable[] = [];
    private _disposed: boolean = false;

    private _onDidChangeTreeData = new EventEmitter<__obsolete_INinjaTreeItem_ | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private onDidChangeWorkspaceFolders({ added, removed }: ALFoldersChangedEvent) {
        this.disposeWatchers(removed);
        this.setUpWatchers(added);
        this.refresh();
    }

    private setUpWatchers(alApps?: ALApp[]) {
        let apps = alApps;
        if (!apps || !apps.length) {
            apps = WorkspaceManager.instance.alApps;
        }
        if (apps.length === 0) {
            return;
        }
        for (let app of apps) {
            const manifestChangedWatcher = app.onManifestChanged(uri => this.refresh(uri));
            const confingChangedWatcher = app.onConfigChanged(uri => this.refresh(uri));
            this._watchers.push(manifestChangedWatcher);
            this._watchers.push(confingChangedWatcher);
            this._watchersMap[app.uri.fsPath] = [manifestChangedWatcher, confingChangedWatcher];
        }
    }

    /**
     * Implements TreeDataProvider<T>
     */
    public getTreeItem(element: __obsolete_INinjaTreeItem_): TreeItem | Promise<TreeItem> {
        return element.getTreeItem(this._expandCollapseController!);
    }

    /**
     * Implements TreeDataProvider<T>
     */
    public getChildren(
        element?: __obsolete_INinjaTreeItem_
    ): __obsolete_INinjaTreeItem_[] | Promise<__obsolete_INinjaTreeItem_[]> {
        if (!element) {
            let apps = WorkspaceManager.instance.alApps;
            if (apps.length === 0) {
                return [new TextTreeItem("No AL workspaces are open.", "There is nothing to show here.", undefined)];
            }

            apps = apps.filter(app => !app.config.appPoolId);
            if (apps.length === 0) {
                return [new TextTreeItem("Only app pools available.", "There is nothing to show here.", undefined)];
            }

            return apps.map(app => {
                const folderItem = new __obsolete_NinjaTreeItem_(
                    app,
                    getFolderTreeItemProvider(app, () => {
                        this.refresh();
                    })
                );
                this._watchers.push(folderItem);
                return folderItem;
            });
        }

        return element.children;
    }

    private refresh(uri?: Uri) {
        if (uri) {
            const app = WorkspaceManager.instance.getALAppFromUri(uri);
            if (app) {
                ExplorerDecorationsProvider.instance.releaseDecorations(app);
            }
        }
        this._onDidChangeTreeData.fire();
    }

    private disposeWatchers(removed?: Uri[]) {
        if (removed) {
            for (let uri of removed) {
                const watchers = this._watchersMap[uri.fsPath];
                if (watchers && watchers.length) {
                    for (let disposable of watchers) {
                        disposable.dispose();
                    }
                }
            }
            return;
        }

        for (let disposable of this._watchers) {
            disposable.dispose();
        }
        this._watchers = [];
    }

    public registerExpandCollapseController(controller: ExpandCollapseController): void {
        this._expandCollapseController = controller;
        this._expandCollapseController.setRefresh(() => {
            this.refresh();
        });
    }

    /**
     * Implements Disposable
     */
    public dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.disposeWatchers();
        this._onDidChangeTreeData.dispose();
        this._workspaceFoldersChangeEvent.dispose();
    }
}
