import { DecorableDescendantNode } from "../../DecorableNode";
import { Node } from "../../Node";
import { AppPoolExplorerRootNode } from "./AppPoolExplorerRootNode";

export interface AppPoolAwareNode extends Node {
    readonly appPoolId: string;
    readonly rootNode: AppPoolExplorerRootNode;
}

export abstract class AppPoolAwareDescendantNode extends DecorableDescendantNode implements AppPoolAwareNode {
    protected override readonly _uriAuthority: string;

    constructor(parent: AppPoolAwareNode) {
        super(parent);
        this._uriAuthority = this.appPoolId;
    }

    public get appPoolId() {
        return this.parent.appPoolId;
    }

    public get parent(): AppPoolAwareNode {
        return this._parent as AppPoolAwareNode;
    }

    public get rootNode(): AppPoolExplorerRootNode {
        return this.parent.rootNode;
    }
}
