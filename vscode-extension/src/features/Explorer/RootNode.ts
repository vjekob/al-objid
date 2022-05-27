import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { AppAwareNode } from "./AppAwareNode";
import { DecorableNode } from "./DecorableNode";

export abstract class RootNode extends DecorableNode implements AppAwareNode {
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
    }

    public get app() {
        return this._app;
    }
}
