import {
    Disposable,
    EventEmitter,
    ThemeColor,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    TreeView,
    Uri,
    window,
} from "vscode";
import { ALApp } from "../../lib/ALApp";
import { ALFoldersChangedEvent } from "../../lib/types/ALFoldersChangedEvent";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { WorkspaceManager } from "../WorkspaceManager";
import { DecorableNode } from "./DecorableNode";
import { ExpandCollapseController } from "./ExpandCollapseController";
import { DecorationsProvider } from "./DecorationsProvider";
import { Node } from "./Node";
import { RootNode } from "./RootNode";
import { TextNode } from "./TextNode";
import { ViewController } from "./ViewController";
import { AppAwareNode } from "./AppAwareNode";
import { SeverityColors } from "./DecorationSeverity";

export abstract class NinjaTreeView implements TreeDataProvider<Node>, ViewController, Disposable {
    private readonly _id: string;
    private readonly _view: TreeView<Node>;
    private readonly _workspaceFoldersChangeEvent: Disposable;
    private readonly _decorationsDisposable: Disposable;
    private readonly _decorationsProvider: DecorationsProvider;
    private readonly _expandCollapseController: ExpandCollapseController;
    private _rootNodes: RootNode[] = [];
    private _rootNodesInitialized: boolean = false;
    private _appRoots: WeakMap<ALApp, RootNode> = new WeakMap();
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
        this._decorationsProvider = new DecorationsProvider();
        this._decorationsDisposable = window.registerFileDecorationProvider(this._decorationsProvider);
        this._expandCollapseController = new ExpandCollapseController(id, () => this.refresh());
    }

    private createTreeView(): TreeView<Node> {
        const view = window.createTreeView(this._id, {
            showCollapseAll: false, // Until there is showExpandAll, we have to use ExpandCollapsecontroller for this
            canSelectMany: false,
            treeDataProvider: this,
        });
        view.onDidCollapseElement(e => this._expandCollapseController.collapse(e.element));
        view.onDidExpandElement(e => this._expandCollapseController.expand(e.element));
        return view;
    }

    private onDidChangeWorkspaceFolders({ added, removed }: ALFoldersChangedEvent) {
        this.disposeWatchers(removed);
        this.setUpWatchers(added);
        this.refreshAfterWorkspaceChange(added, removed);
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

    private disposeWatchers(removed?: ALApp[]) {
        if (removed) {
            for (let app of removed) {
                const watchers = this._watchersMap[app.uri.fsPath];
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
                const node = this._appRoots.get(app);
                this._onDidChangeTreeData.fire(node);
                return;
            }
        }
        this._onDidChangeTreeData.fire();
    }

    private refreshAfterWorkspaceChange(added: ALApp[], removed: ALApp[]) {
        for (let app of removed) {
            this._appRoots.delete(app);
            this._decorationsProvider.releaseDecorations(app);
            for (let i = 0; i < this._rootNodes.length; i++) {
                const node = this._rootNodes[i];
                if (node.app === app) {
                    this._rootNodes.splice(i, 1);
                    node.dispose();
                    break;
                }
            }
        }

        for (let app of added) {
            this.getRootNode(app);
        }

        this._expandCollapseController.reset();
        this.refresh();
    }

    private disposeRootNodes(): void {
        for (let node of this._rootNodes) {
            node.dispose();
        }
    }

    private getRootNode(app: ALApp): RootNode {
        const rootNode = this.createRootNode(app, this);
        this._watchers.push(rootNode);

        this._appRoots.set(app, rootNode);
        this._rootNodes.push(rootNode);
        return rootNode;
    }

    protected getRootNodes(): Node[] | Promise<Node[]> {
        if (this._rootNodesInitialized) {
            return this._rootNodes;
        }

        this.disposeRootNodes();

        this._appRoots = new WeakMap();
        this._rootNodes = [];
        this._rootNodesInitialized = true;

        let apps = WorkspaceManager.instance.alApps;
        if (apps.length === 0) {
            return [new TextNode("No AL workspaces are open.", "There is nothing to show here.")];
        }

        apps = apps.filter(app => !app.config.appPoolId);
        if (apps.length === 0) {
            return [new TextNode("Only app pools available.", "There is nothing to show here.")];
        }

        return apps.map(app => this.getRootNode(app));
    }

    protected abstract createRootNode(app: ALApp, view: ViewController): RootNode;

    //#region Interface implementations

    // Implements TreeDataProvider<Node>
    public getTreeItem(element: Node): TreeItem {
        const item = element.getTreeItem();

        if (element instanceof DecorableNode && element.decoration) {
            this._decorationsProvider.decorate(element.uri, element.decoration);
            if (item.iconPath instanceof ThemeIcon && element.decoration.severity) {
                item.iconPath = new ThemeIcon(
                    item.iconPath.id,
                    new ThemeColor(SeverityColors[element.decoration.severity])
                );
            }
        }

        if (item.id) {
            item.id = `${item.id}.${this._expandCollapseController.iteration}`;
            const state = this._expandCollapseController.getState(element);
            if (state !== undefined && item.collapsibleState !== TreeItemCollapsibleState.None) {
                item.collapsibleState = state;
            }
        }
        return item;
    }

    // Implements TreeDataProvider<Node>
    public getChildren(element?: Node): Node[] | Promise<Node[]> {
        return element?.children || this.getRootNodes();
    }

    // Implements ViewController
    public update(node: Node): void {
        const app = (node as AppAwareNode).app;
        if (app) {
            this._decorationsProvider.releaseDecorations(app);
        }
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
