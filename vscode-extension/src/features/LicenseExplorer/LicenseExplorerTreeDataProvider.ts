// import { Disposable, Event, EventEmitter, TreeDataProvider, workspace } from "vscode";
// import { ALWorkspace } from "../../lib/ALWorkspace";
// import { getManifest } from "../../lib/AppManifest";
// import { PropertyBag } from "../../lib/PropertyBag";
// import { ALRange, AppManifest } from "../../lib/types";
// import { ExplorerDecorationsProvider } from "../RangeExplorer/ExplorerDecorationsProvider";
// import { _ExplorerItemObsolete } from "../Explorer/_ExplorerItemObsolete";
// import { TreeItemInfo } from "../RangeExplorer/TreeItemInfo";
// import { TreeItemSeverity } from "../Explorer/TreeItemSeverity";
// import { TextExplorerItem } from "../Explorer/TextExplorerItem";
// import { WorkspaceExplorerItem } from "../RangeExplorer/WorkspaceExplorerItem";

// export class LicenseExplorerTreeDataProvider
//     implements TreeDataProvider<_ExplorerItemObsolete>, Disposable
// {
//     public static _instance: LicenseExplorerTreeDataProvider;

//     private constructor() {
//         this.setUpWatchers();
//         this._workspaceFoldersChangeEvent = workspace.onDidChangeWorkspaceFolders(
//             this.onDidChangeWorkspaceFolders.bind(this)
//         );
//     }

//     public static get instance() {
//         return this._instance || (this._instance = new LicenseExplorerTreeDataProvider());
//     }

//     private _items: PropertyBag<TreeItemInfo> = {};
//     private _workspaceFoldersChangeEvent: Disposable;
//     private _watchers: Disposable[] = [];
//     private _disposed: boolean = false;

//     private _onDidChangeTreeData: EventEmitter<_ExplorerItemObsolete | undefined | null | void> =
//         new EventEmitter<_ExplorerItemObsolete | undefined | null | void>();
//     readonly onDidChangeTreeData: Event<_ExplorerItemObsolete | undefined | null | void> =
//         this._onDidChangeTreeData.event;

//     private onDidChangeWorkspaceFolders() {
//         this.disposeWatchers();
//         this.setUpWatchers();
//         this.refresh();
//     }

//     private setUpWatchers() {
//         let folders = ALWorkspace.getALFolders();
//         if (!folders) {
//             return;
//         }
//         for (let folder of folders) {
//             const manifest = getManifest(folder.uri)!;
//             const watcher = workspace.createFileSystemWatcher(manifest.ninja.path);
//             watcher.onDidChange(e => this.refresh());
//             this._watchers.push(watcher);
//         }
//     }

//     getTreeItem(element: _ExplorerItemObsolete) {
//         return element;
//     }

//     getChildren(element?: _ExplorerItemObsolete): _ExplorerItemObsolete[] {
//         if (!element) {
//             const folders = ALWorkspace.getALFolders();
//             if (!folders) {
//                 return [
//                     new TextExplorerItem(
//                         "No AL workspaces are open.",
//                         "There is nothing to show here"
//                     ),
//                 ];
//             }
//             return folders?.map(folder => new WorkspaceExplorerItem(getManifest(folder.uri)!));
//         }

//         if (element.hasChildren) {
//             return element.getChildren();
//         }

//         return [];
//     }

//     public getUriString(appId: string, range?: ALRange, objectType?: string): string {
//         let result = `ninja://license/${appId}`;
//         if (range) {
//             result = `${result}/${range.from}-${range.to}`;
//         }
//         if (objectType) {
//             result = `${result}/${objectType}`;
//         }
//         return result;
//     }

//     private buildObjectTypeItemFromCache(
//         appId: string,
//         range: ALRange,
//         objectType: string,
//         ids: number[]
//     ): TreeItemInfo {
//         const size = Math.max(range.to - range.from, 0) + 1;

//         const uri = this.getUriString(appId, range, objectType);
//         const item: TreeItemInfo = {
//             remaining: size - ids.length,
//         };

//         if (item.remaining! < 10) {
//             item.severity = TreeItemSeverity.info;
//             if (item.remaining! <= 5) {
//                 item.severity = TreeItemSeverity.warning;
//                 if (item.remaining! === 0) {
//                     item.severity = TreeItemSeverity.error;
//                 }
//             }
//         }

//         const existing = this._items[uri];
//         if (
//             !existing ||
//             existing.severity !== item.severity ||
//             item.remaining !== existing.remaining ||
//             existing.propagate
//         ) {
//             ExplorerDecorationsProvider.instance.markForUpdate(uri, item);
//         }
//         this._items[uri] = item;

//         return item;
//     }

//     private buildFolderItemsFromCache(manifest: AppManifest): void {
//         const uri = this.getUriString(manifest.id);
//         this._items[uri] = {};

//         // TODO Build license explorer object types virtual folder
//         // For all object types represented in missing object IDs
//     }

//     private buildItemsFromCache(): void {
//         const folders = ALWorkspace.getALFolders();
//         if (!folders) {
//             return;
//         }

//         for (let folder of folders) {
//             const manifest = getManifest(folder.uri)!;
//             this.buildFolderItemsFromCache(manifest);
//         }
//     }

//     refresh() {
//         this.buildItemsFromCache();
//         ExplorerDecorationsProvider.instance.update();
//         this._onDidChangeTreeData.fire();
//     }

//     getTreeItemInfo(uriString: string): TreeItemInfo {
//         return this._items[uriString];
//     }

//     private disposeWatchers() {
//         for (let disposable of this._watchers) {
//             disposable.dispose();
//         }
//         this._watchers = [];
//     }

//     dispose() {
//         if (this._disposed) {
//             return;
//         }
//         this._disposed = true;
//         this.disposeWatchers();
//         this._workspaceFoldersChangeEvent.dispose();
//     }
// }
