import { Disposable, EventEmitter, TreeDataProvider, TreeItem, TreeView, Uri, window } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { ALFoldersChangedEvent } from "../../lib/types/ALFoldersChangedEvent";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { WorkspaceManager } from "../WorkspaceManager";
import { ExpandCollapseController } from "./ExpandCollapseController";
import { NinjaDecorationsProvider } from "./NinjaDecorationsProvider";
import { Node } from "./Node";
import { RootNode } from "./RootNode";
import { TextNode } from "./TextNode";
import { ViewController } from "./ViewController";

export abstract class NinjaTreeView implements TreeDataProvider<Node>, ViewController, Disposable {
    private readonly _id: string;
    private readonly _view: TreeView<Node>;
    private readonly _workspaceFoldersChangeEvent: Disposable;
    private readonly _decorationsDisposable: Disposable;
    private readonly _decorationsProvider: NinjaDecorationsProvider;
    private readonly _expandCollapseController: ExpandCollapseController;
    private _watchersMap: PropertyBag<Disposable[]> = {};
    private _watchers: Disposable[] = [];
    private _disposed: boolean = false;
    private _onDidChangeTreeData = new EventEmitter<Node | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    public constructor(id: string) {
        this.setUpWatchers();
        this._id = id;
        this._view = this.createTreeView();
        this._workspaceFoldersChangeEvent = WorkspaceManager.instance.onDidChangeALFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
        this._decorationsProvider = new NinjaDecorationsProvider();
        this._decorationsDisposable = window.registerFileDecorationProvider(this._decorationsProvider);
        this._expandCollapseController = new ExpandCollapseController(id, () => this.refresh());
    }

    private createTreeView(): TreeView<Node> {
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

    protected getRootItems(): Node[] | Promise<Node[]> {
        let apps = WorkspaceManager.instance.alApps;
        if (apps.length === 0) {
            return [new TextNode("No AL workspaces are open.", "There is nothing to show here.")];
        }

        apps = apps.filter(app => !app.config.appPoolId);
        if (apps.length === 0) {
            return [new TextNode("Only app pools available.", "There is nothing to show here.")];
        }

        return apps.map(app => {
            const folderItem = this.createRootNode(app, this);
            this._watchers.push(folderItem);
            return folderItem;
        });
    }

    protected abstract createRootNode(app: ALApp, view: ViewController): RootNode;

    //#region Interface implementations

    // Implements TreeDataProvider<Node>
    public getTreeItem(element: Node): TreeItem {
        return element.getTreeItem();
        // const authority = element.app?.hash || "unknown";
        // const path = this.getPathFromTreeItem(element);
        // const id = `${authority}.${path}.${Date.now()}`;
        // element.id = id;
        // let treeItem = new TreeItem(element.label!, TreeItemCollapsibleState.Expanded);
        // treeItem.label = element.label;
        // if (element.icon) {
        //     treeItem.iconPath = element.icon;
        // }
        // if (element.tooltip) {
        //     treeItem.tooltip = element.tooltip;
        // }
        // if (element.contextValue) {
        //     treeItem.contextValue = element.contextValue;
        // }
        // if (element.description) {
        //     treeItem.description = element.description;
        // }
        // treeItem.id = id;
        // treeItem.resourceUri = Uri.from({ scheme: NINJA_URI_SCHEME, authority, path });
        // const state = this._expandCollapseController.getState(path) || element.collapsibleState;
        // if (state !== undefined) {
        //     treeItem.collapsibleState = state;
        // }
        // if (element.decoration) {
        //     this._decorationsProvider.decorate(treeItem.resourceUri, element.decoration);
        // }
        // return treeItem;
    }

    // Implements TreeDataProvider<Node>
    public getChildren(element?: Node): Node[] | Promise<Node[]> {
        return element?.children || this.getRootItems();
    }

    // Implements ViewController
    public update(node: Node): void {
        this._onDidChangeTreeData.fire(node);
    }

    // Implements Disposable
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
