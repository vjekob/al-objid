import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { DecorableNode } from "./DecorableNode";
import { ViewAwareNode } from "./ViewAwareNode";
import { ViewController } from "./ViewController";

export abstract class RootNode extends DecorableNode implements ViewAwareNode {
    protected readonly _iconPath = ThemeIcon.Folder;
    protected readonly _view: ViewController;
    protected readonly _uriPathPart = "";
    protected readonly _collapsibleState: TreeItemCollapsibleState;
    protected abstract _uriAuthority: string;
    protected abstract _label: string;
    protected abstract _description: string;
    protected abstract _tooltip: string;

    constructor(view: ViewController) {
        super(undefined);

        this._view = view;
        this._collapsibleState = TreeItemCollapsibleState.Expanded;
    }

    public get view() {
        return this._view;
    }
}
