import { ThemeIcon, TreeItem, Uri } from "vscode";
import { NINJA_URI_SCHEME } from "../../lib/constants";
import { Decoration } from "./Decoration";
import { Node } from "./Node";

/**
 * Represents a decorable tree node that may or may not have a parent. A decorable
 * node is such a node that contains a Uri and may contain additional decorations.
 */
export abstract class DecorableNode extends Node {
    constructor(parent: Node | undefined) {
        super(parent);
    }

    private _uri: Uri | undefined;
    protected abstract readonly _iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon;
    protected abstract readonly _uriAuthority: string;
    protected abstract readonly _uriPathPart: string;
    protected _decoration: Decoration | undefined;

    private getPath(): string {
        let path = this._uriPathPart;
        let parent = this._parent;
        while (parent && parent instanceof DecorableNode) {
            path = path ? `${parent._uriPathPart}${parent._uriPathPart ? "/" : ""}${path}` : parent._uriPathPart;
            parent = parent._parent;
        }
        return path ? `/${path}` : "";
    }

    private createUri(): Uri {
        return Uri.from({
            scheme: NINJA_URI_SCHEME,
            authority: this._uriAuthority,
            path: this.getPath(),
        });
    }

    protected override completeTreeItem(item: TreeItem) {
        item.resourceUri = this.uri;
        item.id = `${this.uri.toString()}`;
        item.iconPath = this._iconPath;
    }

    public get uri() {
        if (!this._uri) {
            this._uri = this.createUri();
        }

        return this._uri;
    }

    public get decoration() {
        return this._decoration;
    }
}

/**
 * Represents a decorable node that must have a parent.
 */
export abstract class DecorableDescendantNode extends DecorableNode {
    constructor(parent: Node) {
        super(parent);
    }
}
