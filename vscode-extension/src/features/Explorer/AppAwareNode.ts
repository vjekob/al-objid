import { ALApp } from "../../lib/ALApp";
import { DecorableDescendantNode } from "./DecorableNode";
import { Node } from "./Node";

export interface AppAwareNode extends Node {
    readonly app: ALApp;
}

export abstract class AppAwareDescendantNode extends DecorableDescendantNode {
    protected override readonly _uriAuthority: string;

    constructor(parent: AppAwareNode) {
        super(parent);
        this._uriAuthority = parent.app.hash;
    }

    public get app() {
        return this.parent.app;
    }

    public get parent(): AppAwareNode {
        return this._parent as AppAwareNode;
    }
}
