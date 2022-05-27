import {
    Disposable,
    EventEmitter,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    TreeView,
    Uri,
    window,
} from "vscode";
import { ALApp } from "../../lib/ALApp";
import { NINJA_URI_SCHEME } from "../../lib/constants";
import { ALFoldersChangedEvent } from "../../lib/types/ALFoldersChangedEvent";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { WorkspaceManager } from "../WorkspaceManager";
import { ExpandCollapseController } from "./ExpandCollapseController";
import { NinjaDecorationsProvider } from "./NinjaDecorationsProvider";
import { TreeViewRootFactory } from "./NinjaTreeDataProvider";
import { NinjaTreeItem } from "./NinjaTreeItem";
import { TextTreeItem } from "./TextTreeItem";

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

export class NinjaTreeView implements TreeDataProvider<NinjaTreeItem>, Disposable {
    private readonly _id: string;
    private readonly _view: TreeView<NinjaTreeItem>;
    private readonly _factory: TreeViewRootFactory;
    private readonly _workspaceFoldersChangeEvent: Disposable;
    private readonly _decorationsDisposable: Disposable;
    private readonly _decorationsProvider: NinjaDecorationsProvider;
    private readonly _expandCollapseController: ExpandCollapseController;
    private _watchersMap: PropertyBag<Disposable[]> = {};
    private _watchers: Disposable[] = [];
    private _disposed: boolean = false;
    private _onDidChangeTreeData = new EventEmitter<NinjaTreeItem | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    public constructor(id: string, factory: TreeViewRootFactory) {
        this.setUpWatchers();
        this._id = id;
        this._view = this.createTreeView();
        this._factory = factory;
        this._workspaceFoldersChangeEvent = WorkspaceManager.instance.onDidChangeALFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
        this._decorationsProvider = new NinjaDecorationsProvider();
        this._decorationsDisposable = window.registerFileDecorationProvider(this._decorationsProvider);
        this._expandCollapseController = new ExpandCollapseController(id, () => this.refresh());
    }

    private createTreeView(): TreeView<NinjaTreeItem> {
        const view = window.createTreeView(this._id, {
            showCollapseAll: false, // Until there is showExpandAll, we have to use ExpandCollapsecontroller for this
            canSelectMany: false,
            treeDataProvider: this,
        });
        view.onDidCollapseElement(e => this._expandCollapseController.collapse(e.element.id!));
        view.onDidExpandElement(e => this._expandCollapseController.expand(e.element.id!));
        return view;
    }

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

    private refresh(uri?: Uri) {
        if (uri) {
            const app = WorkspaceManager.instance.getALAppFromUri(uri);
            if (app) {
                this._decorationsProvider.releaseDecorations(app);
            }
        }
        this._onDidChangeTreeData.fire();
    }

    protected getRootItems(): NinjaTreeItem[] | Promise<NinjaTreeItem[]> {
        let apps = WorkspaceManager.instance.alApps;
        if (apps.length === 0) {
            return [new TextTreeItem("No AL workspaces are open.", "There is nothing to show here.")];
        }

        apps = apps.filter(app => !app.config.appPoolId);
        if (apps.length === 0) {
            return [new TextTreeItem("Only app pools available.", "There is nothing to show here.")];
        }

        return apps.map(app => {
            const folderItem = this._factory(app, item => this._onDidChangeTreeData.fire(item));
            this._watchers.push(folderItem);
            return folderItem;
        });
    }

    private getPathFromTreeItem(item: NinjaTreeItem): string {
        let path = item.path;
        let parent = item.parent;
        while (parent) {
            path = path ? `${parent.path}${parent.path ? "/" : ""}${path}` : parent.path;
            parent = parent.parent;
        }
        return path ? `/${path}` : "";
    }

    //#region Interface implementations

    /**
     * Implements TreeDataProvider<NinjaTreeItem>
     */
    public async getTreeItem(element: NinjaTreeItem): Promise<TreeItem> {
        const authority = element.app?.hash || "unknown";
        const path = this.getPathFromTreeItem(element);
        const id = `${authority}.${path}.${Date.now()}`;
        element.id = id;

        let treeItem = new TreeItem(element.label!, TreeItemCollapsibleState.Expanded);
        treeItem.label = element.label;
        if (element.icon) {
            treeItem.iconPath = element.icon;
        }
        if (element.tooltip) {
            treeItem.tooltip = element.tooltip;
        }
        if (element.contextValue) {
            treeItem.contextValue = element.contextValue;
        }
        if (element.description) {
            treeItem.description = element.description;
        }
        treeItem.id = id;
        treeItem.resourceUri = Uri.from({ scheme: NINJA_URI_SCHEME, authority, path });

        const state = this._expandCollapseController.getState(path) || element.collapsibleState;
        if (state !== undefined) {
            treeItem.collapsibleState = state;
        }

        if (element.decoration) {
            this._decorationsProvider.decorate(treeItem.resourceUri, element.decoration);
        }
        return treeItem;
    }

    /**
     * Implements TreeDataProvider<NinjaTreeItem>
     */
    public getChildren(element?: NinjaTreeItem): NinjaTreeItem[] | Promise<NinjaTreeItem[]> {
        if (!element) {
            return this.getRootItems();
        }

        return element.getChildren ? element.getChildren() : [];
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
        this._view.dispose();
        this._decorationsDisposable.dispose();
    }

    //#endregion
}
