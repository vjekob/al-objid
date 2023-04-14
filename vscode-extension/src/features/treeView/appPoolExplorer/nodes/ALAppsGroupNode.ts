import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { TreeItemCollapsibleState } from "vscode";
import { DecorableNode } from "../../DecorableNode";
import { Node } from "../../Node";
import { ALApp } from "../../../../lib/ALApp";
import { AppPoolExplorerRootNode } from "./AppPoolExplorerRootNode";
import { ALAppNode } from "./ALAppNode";

export class ALAppsGroupNode extends DecorableNode {
    private readonly _apps: ALApp[];
    protected readonly _uriPathPart = "pool-apps";
    protected readonly _iconPath = NinjaIcon["al-apps"];
    protected readonly _uriAuthority: string;
    protected readonly _tooltip = "AL Apps known to belong to this App Pool";
    protected readonly _label = "AL Apps";
    protected readonly _collapsibleState = TreeItemCollapsibleState.Collapsed;

    constructor(parent: AppPoolExplorerRootNode) {
        super(parent);
        this._apps = parent.apps;
        this._uriAuthority = parent.appPoolId;
    }

    protected override getChildren(): Node[] | Promise<Node[]> {
        return [
            ...this._apps.map(app => new ALAppNode(this, app, false)),
            new ALAppNode(this, { name: "Cloud App", hash: "asoifjaoej" } as ALApp, true),
        ];
    }

    public get appPoolId(): string {
        return (this._parent as AppPoolExplorerRootNode).appPoolId;
    }
}
