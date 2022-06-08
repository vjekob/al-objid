import {
    Disposable,
    EventEmitter,
    ThemeColor,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    TreeView,
    window,
} from "vscode";
import { ALApp } from "../../lib/ALApp";
import { ALFoldersChangedEvent } from "../../lib/types/ALFoldersChangedEvent";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { WorkspaceManager } from "../WorkspaceManager";
import { DecorableNode } from "./DecorableNode";
import { ExpandCollapseController } from "./ExpandCollapseController";
import { Node } from "./Node";
import { ViewController } from "./ViewController";
import { SeverityColors } from "./DecorationSeverity";
import { Decoration } from "./Decoration";
import { DecorationsProvider } from "./DecorationsProvider";

export abstract class NinjaTreeView implements TreeDataProvider<Node>, ViewController, Disposable {
    private readonly _id: string;
    private readonly _view: TreeView<Node>;
    private readonly _workspaceFoldersChangeEvent: Disposable;
    private _disposed: boolean = false;
    private _watchersMap: PropertyBag<Disposable[]> = {};
    private _watchers: Disposable[] = [];
    protected readonly _expandCollapseController: ExpandCollapseController;
    protected readonly _decorationsProvider: DecorationsProvider;
    protected readonly _decorationsDisposable: Disposable;
    protected _onDidChangeTreeData = new EventEmitter<Node | void>();
    public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    public constructor(id: string) {
        this.setUpWatchers();
        this._id = id;
        this._view = this.createTreeView();
        this._workspaceFoldersChangeEvent = WorkspaceManager.instance.onDidChangeALFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
        this._expandCollapseController = new ExpandCollapseController(id, () => this.refresh());
        this._decorationsProvider = new DecorationsProvider();
        this._decorationsDisposable = window.registerFileDecorationProvider(this._decorationsProvider);
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

        for (let app of removed) {
            this._decorationsProvider.releaseDecorations(app);
        }
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
            const manifestChangedWatcher = app.onManifestChanged(app => this.onManifestOrConfigChanged(app));
            const confingChangedWatcher = app.onConfigChanged(app => this.onManifestOrConfigChanged(app));
            this._watchers.push(manifestChangedWatcher);
            this._watchers.push(confingChangedWatcher);
            this._watchersMap[app.uri.fsPath] = [manifestChangedWatcher, confingChangedWatcher];
        }
    }

    private onManifestOrConfigChanged(app: ALApp) {
        this._decorationsProvider.releaseDecorations(app);
        this.refreshAfterConfigChange(app);
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

    protected refresh() {
        this._onDidChangeTreeData.fire();
    }

    protected abstract refreshAfterConfigChange(app: ALApp): void;
    protected abstract refreshAfterWorkspaceChange(added: ALApp[], removed: ALApp[]): void;
    protected abstract getRootNodes(): Node[] | Promise<Node[]>;
    protected abstract disposeExtended(): void;
    protected abstract decorate(element: DecorableNode, decoration: Decoration): void;

    //#region Interface implementations

    // Implements TreeDataProvider<Node>
    public getTreeItem(element: Node): TreeItem {
        const item = element.getTreeItem();

        if (element instanceof DecorableNode && element.decoration) {
            this.decorate(element, element.decoration);
        }

        if (item.id) {
            item.id = `${item.id}.${item.collapsibleState}.${this._expandCollapseController.iteration}`;
            const state = this._expandCollapseController.getState(element, element.collapsibleState);
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
    public abstract update(node: Node): void;

    // Implements Disposable
    public dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.disposeWatchers();
        this.disposeExtended();
        this._onDidChangeTreeData.dispose();
        this._workspaceFoldersChangeEvent.dispose();
        this._view.dispose();
        this._decorationsDisposable?.dispose();
    }

    //#endregion
}
