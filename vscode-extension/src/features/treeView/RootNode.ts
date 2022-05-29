import { Disposable, ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { ConsumptionCache } from "../ConsumptionCache";
import { AppAwareNode } from "./AppAwareNode";
import { ContextValues } from "./ContextValues";
import { DecorableNode } from "./DecorableNode";
import { ViewAwareNode } from "./ViewAwareNode";
import { ViewController } from "./ViewController";

export abstract class RootNode extends DecorableNode implements AppAwareNode, ViewAwareNode, Disposable {
    private _disposed = false;
    private readonly _subscription: Disposable;
    protected readonly _iconPath = ThemeIcon.Folder;
    protected readonly _app: ALApp;
    protected readonly _view: ViewController;
    protected readonly _uriAuthority: string;
    protected readonly _label: string;
    protected readonly _uriPathPart = "";
    protected readonly _collapsibleState: TreeItemCollapsibleState;

    constructor(app: ALApp, view: ViewController) {
        super(undefined);

        this._app = app;
        this._view = view;
        this._label = app.name || app.manifest.name;
        this._description = app.manifest.version;
        this._tooltip = `${app.manifest.name} v${app.manifest.version}`;
        this._uriAuthority = app.hash;
        this._collapsibleState = TreeItemCollapsibleState.Expanded;
        this._contextValues.push(ContextValues.Sync);

        this._subscription = ConsumptionCache.instance.onConsumptionUpdate(app.hash, () => {
            this._view.update(this);
        });
    }

    public get app() {
        return this._app;
    }

    public get view() {
        return this._view;
    }

    public dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._subscription.dispose();
    }
}
