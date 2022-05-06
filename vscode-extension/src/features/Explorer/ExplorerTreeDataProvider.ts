import { Disposable, Event, EventEmitter, TreeDataProvider, workspace } from "vscode";
import { ALWorkspace } from "../../lib/ALWorkspace";
import { getManifest } from "../../lib/AppManifest";
import { PropertyBag } from "../../lib/PropertyBag";
import { ALRange, AppManifest } from "../../lib/types";
import { ConsumptionCache } from "../ConsumptionCache";
import { ExplorerDecorationsProvider } from "./ExplorerDecorationsProvider";
import { ExplorerItem } from "./ExplorerItem";
import { ExplorerItemFactory } from "./ExplorerItemFactory";
import { ExplorerItemType } from "./ExplorerItemType";
import { TreeItemInfo } from "./TreeItemInfo";
import { TreeItemSeverity } from "./TreeItemSeverity";

export class ExplorerTreeDataProvider implements TreeDataProvider<ExplorerItem>, Disposable {
    public static _instance: ExplorerTreeDataProvider;

    private constructor() {
        this.setUpWatchers();
        this._workspaceFoldersChangeEvent = workspace.onDidChangeWorkspaceFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
    }

    public static get instance() {
        return this._instance || (this._instance = new ExplorerTreeDataProvider());
    }

    private _items: PropertyBag<TreeItemInfo> = {};
    private _workspaceFoldersChangeEvent: Disposable;
    private _watchers: Disposable[] = [];
    private _disposed: boolean = false;

    private _onDidChangeTreeData: EventEmitter<ExplorerItem | undefined | null | void> =
        new EventEmitter<ExplorerItem | undefined | null | void>();
    readonly onDidChangeTreeData: Event<ExplorerItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private onDidChangeWorkspaceFolders() {
        this.disposeWatchers();
        this.setUpWatchers();
        this.refresh();
    }

    private setUpWatchers() {
        let folders = ALWorkspace.getALFolders();
        if (!folders) {
            return;
        }
        for (let folder of folders) {
            const manifest = getManifest(folder.uri)!;
            const watcher = workspace.createFileSystemWatcher(manifest.ninja.path);
            watcher.onDidChange(e => this.refresh());
            this._watchers.push(watcher);
        }
    }

    getTreeItem(element: ExplorerItem) {
        return element;
    }

    getChildren(element?: ExplorerItem): ExplorerItem[] {
        if (!element) {
            const folders = ALWorkspace.getALFolders();
            if (!folders) {
                return [
                    ExplorerItemFactory.text(
                        "No AL workspaces are open.",
                        "There is nothing to show here"
                    ),
                ];
            }
            return folders?.map(folder => ExplorerItemFactory.workspace(folder.uri));
        }

        if (element.hasChildren) {
            return element.getChildren();
        }

        return [];
    }

    public getUriString(appId: string, range?: ALRange, objectType?: string): string {
        let result = `ninja://${appId}`;
        if (range) {
            result = `${result}/${range.from}-${range.to}`;
        }
        if (objectType) {
            result = `${result}/${objectType}`;
        }
        return result;
    }

    private buildObjectTypeItemFromCache(
        appId: string,
        range: ALRange,
        objectType: string,
        ids: number[]
    ): TreeItemInfo {
        const size = Math.max(range.to - range.from, 0) + 1;

        const uri = this.getUriString(appId, range, objectType);
        const item: TreeItemInfo = {
            type: ExplorerItemType.objectType,
            remaining: size - ids.length,
        };

        if (item.remaining! < 10) {
            item.severity = TreeItemSeverity.info;
            if (item.remaining! <= 5) {
                item.severity = TreeItemSeverity.warning;
                if (item.remaining! === 0) {
                    item.severity = TreeItemSeverity.error;
                }
            }
        }

        const existing = this._items[uri];
        if (
            !existing ||
            existing.severity !== item.severity ||
            item.remaining !== existing.remaining ||
            existing.propagate
        ) {
            ExplorerDecorationsProvider.instance.markForUpdate(uri, item);
        }
        this._items[uri] = item;

        return item;
    }

    private buildRangeItemsFromCache(appId: string, range: ALRange): void {
        const uri = this.getUriString(appId, range);
        this._items[uri] = {
            type: ExplorerItemType.range,
        };
        const consumption = ConsumptionCache.instance.getConsumption(appId) as any;
        if (!consumption) {
            return;
        }

        let severity = TreeItemSeverity.none;
        let propagateItem: TreeItemInfo | undefined;
        for (var type of Object.keys(consumption)) {
            const ids = ((consumption[type] as number[]) || []).filter(
                id => id >= range.from && id <= range.to
            );
            const item = this.buildObjectTypeItemFromCache(appId, range, type, ids);
            if (item.severity! > severity) {
                severity = item.severity!;
                propagateItem = item;
            }
        }
        if (propagateItem) {
            propagateItem.propagate = true;
        }
    }

    private buildFolderItemsFromCache(manifest: AppManifest): void {
        const uri = this.getUriString(manifest.id);
        this._items[uri] = {
            type: ExplorerItemType.workspace,
        };

        const ranges = manifest.ninja.config.idRanges.length
            ? manifest.ninja.config.idRanges
            : manifest.idRanges;

        for (let range of ranges) {
            this.buildRangeItemsFromCache(manifest.id, range);
        }
    }

    private buildItemsFromCache(): void {
        const folders = ALWorkspace.getALFolders();
        if (!folders) {
            return;
        }

        for (let folder of folders) {
            const manifest = getManifest(folder.uri)!;
            this.buildFolderItemsFromCache(manifest);
        }
    }

    refresh() {
        this.buildItemsFromCache();
        ExplorerDecorationsProvider.instance.update();
        this._onDidChangeTreeData.fire();
    }

    getTreeItemInfo(uriString: string): TreeItemInfo {
        return this._items[uriString];
    }

    private disposeWatchers() {
        for (let disposable of this._watchers) {
            disposable.dispose();
        }
        this._watchers = [];
    }

    dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.disposeWatchers();
        this._workspaceFoldersChangeEvent.dispose();
    }
}
