import { window } from "vscode";
import { ALApp } from "../../../lib/ALApp";
import { PropertyBag } from "../../../lib/types/PropertyBag";
import { WorkspaceManager } from "../../WorkspaceManager";
import { DecorableNode } from "../DecorableNode";
import { Decoration } from "../Decoration";
import { NinjaTreeView } from "../NinjaTreeView";
import { Node } from "../Node";
import { AppPoolAwareNode } from "./nodes/AppPoolAwareNode";
import { AppPoolExplorerRootNode } from "./nodes/AppPoolExplorerRootNode";

export class AppPoolExplorerView extends NinjaTreeView {
    private readonly _poolMap: PropertyBag<ALApp[]> = {};
    private _poolIds: string[] = [];
    protected refreshAfterConfigChange(app: ALApp): void {}
    protected refreshAfterWorkspaceChange(added: ALApp[], removed: ALApp[]): void {}

    protected getRootNodes(): Node[] | Promise<Node[]> {
        for (let app of WorkspaceManager.instance.alApps) {
            const { appPoolId } = app.config;
            if (!appPoolId) {
                continue;
            }
            if (!this._poolMap[appPoolId]) {
                this._poolIds.push(appPoolId);
                this._poolMap[appPoolId] = [app];
                continue;
            }
            this._poolMap[appPoolId].push(app);
        }
        return [...this._poolIds.map(id => new AppPoolExplorerRootNode(id, this._poolMap[id], this))];
    }

    protected disposeExtended(): void {}

    protected override decorate(element: DecorableNode, decoration: Decoration): void {
        this._decorationsProvider.decorate(element.uri, decoration);
    }

    public update(node: Node): void {
        const { appPoolId } = node as AppPoolAwareNode;
        if (appPoolId) {
            this._decorationsProvider.releaseDecorations(appPoolId);
        }
        this._onDidChangeTreeData.fire(node);
    }
}
