import { Disposable, ThemeColor, ThemeIcon, TreeItem, TreeItemCollapsibleState, TreeItemLabel, Uri } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { ExplorerDecorationsProvider } from "../RangeExplorer/ExplorerDecorationsProvider";
import { ExpandCollapseController } from "./ExpandCollapseController";
import { NinjaTreeItemProvider } from "./NinjaTreeItemProvider";
import { TreeItemDecoration } from "./TreeItemDecoration";
import { SeverityColors } from "./TreeItemSeverity";

type NinjaTreeItemLabelType = string | TreeItemLabel;
type NinjaTreeItemIconType = string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon;

export type NinjaTreeItemLabel = NinjaTreeItemLabelType | Promise<NinjaTreeItemLabelType>;
export type NinjaTreeItemIcon = NinjaTreeItemIconType | Promise<NinjaTreeItemIconType>;

export interface INinjaTreeItem {
    id: string;
    getTreeItem: (controller: ExpandCollapseController) => TreeItem | Promise<TreeItem>;
    children: INinjaTreeItem[] | Promise<INinjaTreeItem[]>;
}

export interface UpdateNinjaTreeItem {
    // TODO Updating should work not by directly calling the update method
    // Instead, update should populate item(s) into an array that is later refreshed through a single call to event.fire
    (item: INinjaTreeItem): void;
}

export class NinjaTreeItem implements INinjaTreeItem, Disposable {
    private readonly _app: ALApp;
    private readonly _provider: NinjaTreeItemProvider;
    private _id: string | undefined;
    private _children: INinjaTreeItem[] | undefined;
    private _childrenPromise: Promise<INinjaTreeItem[]> | undefined;
    private _disposed = false;

    constructor(app: ALApp, provider: NinjaTreeItemProvider) {
        this._app = app;
        this._provider = provider;
    }

    private createItem(templateItem: TreeItem) {
        const item = new TreeItem(templateItem.label!, templateItem.collapsibleState);
        item.description = templateItem.description;
        item.tooltip = templateItem.tooltip;
        item.iconPath = templateItem.iconPath;
        item.resourceUri = templateItem.resourceUri;
        item.id = templateItem.id;
        item.contextValue = templateItem.contextValue; // Referenced in package.json "when" view condition
        return item;
    }

    getTreeItem(controller: ExpandCollapseController): TreeItem | Promise<TreeItem> {
        const promises: Promise<any>[] = [];

        const decomposePromise = <T>(target: T | Promise<T>, assign: (result: T) => void) => {
            if (target instanceof Promise) {
                target.then(result => assign(result));
                promises.push(target);
            }
        };

        let label = this._provider.getLabel();
        decomposePromise(label, result => (label = result));

        let collapsibleState = this._provider.getCollapsibleState();
        decomposePromise(collapsibleState, result => (collapsibleState = result));

        let iconPath = this._provider.getIcon();
        decomposePromise(iconPath, result => (iconPath = result));

        let uriPath = this._provider.getUriPath();
        decomposePromise(uriPath, result => (uriPath = result));

        let tooltip: string | undefined | Promise<string>;
        if (this._provider.getTooltip) {
            tooltip = this._provider.getTooltip();
            decomposePromise(tooltip, result => (tooltip = result));
        }

        let description: string | undefined | Promise<string>;
        if (this._provider.getDescription) {
            description = this._provider.getDescription();
            decomposePromise(description, result => (description = result));
        }

        let contextValue: string | undefined | Promise<string>;
        if (this._provider.getContextValue) {
            contextValue = this._provider.getContextValue();
            decomposePromise(contextValue, result => (contextValue = result));
        }

        let decoration: TreeItemDecoration | undefined | Promise<TreeItemDecoration | undefined>;
        if (this._provider.getDecoration) {
            decoration = this._provider.getDecoration();
            decomposePromise(decoration, result => (decoration = result));
        }

        const decorate = (uri: Uri) => {
            if (decoration) {
                ExplorerDecorationsProvider.instance.decorate(uri, decoration as TreeItemDecoration);
            }
        };

        const createItem = () => {
            if (iconPath instanceof ThemeIcon && decoration) {
                iconPath = new ThemeIcon(
                    iconPath.id,
                    new ThemeColor(SeverityColors[`${(decoration as TreeItemDecoration).severity}`])
                );
            }
            this._id = `ninja/${this._app.hash}${uriPath}`;
            const state = controller?.getState(this._id) || (collapsibleState as TreeItemCollapsibleState);
            return this.createItem({
                label: label as NinjaTreeItemLabelType,
                description: description as string | undefined,
                collapsibleState: state,
                tooltip: tooltip as string,
                iconPath: iconPath as NinjaTreeItemIconType,
                resourceUri: Uri.from({
                    scheme: "ninja",
                    authority: this._app.hash,
                    path: uriPath as string,
                }),
                id: `${this._id}.${Date.now()}`, // Date.now() is there to allow programmatic expand/collapse
                contextValue: contextValue as string | undefined,
            });
        };

        if (promises.length) {
            return new Promise<TreeItem>(async resolve => {
                await Promise.all(promises);
                const item = createItem();
                decorate(item.resourceUri!);
                resolve(item);
            });
        }

        const item = createItem();
        decorate(item.resourceUri!);
        return item;
    }

    public get children(): INinjaTreeItem[] | Promise<INinjaTreeItem[]> {
        if (this._children) {
            return this._children;
        }

        if (this._childrenPromise) {
            return this._childrenPromise;
        }

        if (typeof this._provider.getChildren === "function") {
            const children = this._provider.getChildren(this);
            if (children instanceof Promise) {
                this._childrenPromise = children;
                this._childrenPromise.then(result => {
                    this._children = result;
                    this._childrenPromise = undefined;
                });
                return this._childrenPromise;
            }
            this._children = children;
            return this._children;
        }

        return [];
    }

    public get id(): string {
        return this._id || "";
    }

    public dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;

        if (this._provider.dispose) {
            this._provider.dispose();
        }
    }
}
