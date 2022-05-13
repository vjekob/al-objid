import { ExplorerDecorationsProvider } from "./ExplorerDecorationsProvider";
import { Disposable, EventEmitter, TreeItem, Uri, workspace } from "vscode";
import { ALRange } from "../../lib/types/ALRange";
import { TextTreeItem } from "../Explorer/TextTreeItem";
import { INinjaTreeItem, NinjaTreeItem } from "../Explorer/NinjaTreeItem";
import { getFolderTreeItemProvider } from "./TreeItemProviders";
import { WorkspaceManager } from "../WorkspaceManager";
import { NinjaTreeDataProvider } from "../Explorer/NinjaTreeDataProvider";
import { ExpandCollapseController } from "../Explorer/ExpandCollapseController";

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

export class RangeExplorerTreeDataProvider implements NinjaTreeDataProvider, Disposable {
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
    private _expandCollapseController: ExpandCollapseController | undefined;
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
        let apps = WorkspaceManager.instance.alApps;
        if (apps.length === 0) {
            return;
        }
        for (let app of apps) {
            this._watchers.push(app.onManifestChanged(uri => this.refresh(uri)));
            this._watchers.push(app.onConfigChanged(uri => this.refresh(uri)));
        }
    }

    getTreeItem(element: INinjaTreeItem): TreeItem | Promise<TreeItem> {
        return element.getTreeItem(this._expandCollapseController!);
    }

    getChildren(element?: INinjaTreeItem): INinjaTreeItem[] | Promise<INinjaTreeItem[]> {
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
                const folderItem = new NinjaTreeItem(
                    app,
                    getFolderTreeItemProvider(app, item => {
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
            const app = WorkspaceManager.instance.getALAppFromUri(uri);
            if (app) {
                ExplorerDecorationsProvider.instance.releaseDecorations(app);
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

    public registerExpandCollapseController(controller: ExpandCollapseController): void {
        this._expandCollapseController = controller;
        this._expandCollapseController.setRefresh(() => {
            this.refresh();
        });
    }

    dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.disposeWatchers();
        this._onDidChangeTreeData.dispose();
        this._workspaceFoldersChangeEvent.dispose();
    }
}
