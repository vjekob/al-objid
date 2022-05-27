import { Disposable, MarkdownString, ThemeIcon, TreeItemCollapsibleState, TreeItemLabel, Uri } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { TreeItemDecoration } from "./TreeItemDecoration";

export interface NinjaTreeItem {
    id?: string;
    readonly app?: ALApp;
    readonly parent?: NinjaTreeItem;
    readonly path: string;
    readonly label: string | TreeItemLabel;
    readonly icon?: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon;
    readonly collapsibleState?: TreeItemCollapsibleState;
    readonly tooltip?: string | MarkdownString;
    readonly contextValue?: string;
    readonly description?: string;
    readonly decoration?: TreeItemDecoration;
    getChildren?: () => NinjaTreeItem[] | Promise<NinjaTreeItem[]>;
}

export interface NinjaAppTreeItem extends NinjaTreeItem {
    readonly app: ALApp;
    readonly parent: NinjaTreeItem;
}

export interface DisposableNinjaTreeItem extends NinjaTreeItem, Disposable {}
