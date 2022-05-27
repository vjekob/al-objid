import { Disposable, ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { ConsumptionCache } from "../ConsumptionCache";
import { AppAwareNode } from "./AppAwareNode";
import { DecorableNode } from "./DecorableNode";

export abstract class RootNode extends DecorableNode implements AppAwareNode, Disposable {
    private _disposed = false;
    private readonly _subscription: Disposable;
    protected readonly _iconPath = ThemeIcon.Folder;
    protected readonly _app: ALApp;
    protected readonly _uriAuthority: string;
    protected readonly _label: string;
    protected readonly _uriPathPart = "";
    protected readonly _collapsibleState: TreeItemCollapsibleState;

    constructor(app: ALApp) {
        super(undefined);

        this._app = app;
        this._label = app.name || app.manifest.name;
        this._description = app.manifest.version;
        this._uriAuthority = app.hash;
        this._collapsibleState = TreeItemCollapsibleState.Expanded;

        this._subscription = ConsumptionCache.instance.onConsumptionUpdate(app.hash, () => {
            // TODO Update tree or child
            // update(item);
        });
    }

    public get app() {
        return this._app;
    }

    public dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
    }
}
