import { workspace, window } from "vscode";

export class ExpandCollapseController {
    private _expandAll: boolean = false;
    private _collapseAll: boolean = false;

    public get isExpandAll() {
        return this._expandAll;
    }

    public get isCollapseAll() {
        return this._collapseAll;
    }

    public expandAll() {
        this._expandAll = true;
        this._collapseAll = false;
    }

    public collapseAll() {
        this._expandAll = false;
        this._collapseAll = true;
    }

    public reset() {
        this._expandAll = false;
        this._collapseAll = false;
    }
}
