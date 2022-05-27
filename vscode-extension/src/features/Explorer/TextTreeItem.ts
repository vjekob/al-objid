import { MarkdownString, ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { NinjaTreeItem } from "./NinjaTreeItem";

export class TextTreeItem implements NinjaTreeItem {
    public constructor(text: string, tooltip: string | MarkdownString, parent?: NinjaTreeItem) {
        this.app = parent?.app;
        this.parent = parent;
        this.description = text;
        this.tooltip = tooltip;
        this.path = `[${text}]`;
    }

    public readonly app: ALApp | undefined;
    public readonly parent: NinjaTreeItem | undefined;
    public readonly tooltip: string | MarkdownString;
    public readonly description: string;
    readonly label: string = "";
    public readonly path: string;
    public readonly icon = "";
    public readonly collapsibleState = TreeItemCollapsibleState.None;
}
