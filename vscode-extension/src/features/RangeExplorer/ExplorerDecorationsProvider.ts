import {
    Event,
    EventEmitter,
    FileDecoration,
    FileDecorationProvider,
    ProviderResult,
    ThemeColor,
    Uri,
} from "vscode";
import { PropertyBag } from "../../lib/PropertyBag";
import { TreeItemInfo } from "./TreeItemInfo";
import { TreeItemSeverity } from "../Explorer/TreeItemSeverity";

const Colors: any = {
    undefined: "foreground",
    [`${TreeItemSeverity.none}`]: "foreground",
    [`${TreeItemSeverity.info}`]: "editorInfo.foreground",
    [`${TreeItemSeverity.warning}`]: "list.warningForeground",
    [`${TreeItemSeverity.error}`]: "list.errorForeground",
};

export class ExplorerDecorationsProvider implements FileDecorationProvider {
    private static _instance: ExplorerDecorationsProvider;
    private constructor() {}
    public static get instance() {
        return this._instance || (this._instance = new ExplorerDecorationsProvider());
    }

    private _treeItems: PropertyBag<TreeItemInfo> = {};
    private _updated: PropertyBag<boolean> = {};

    private _onDidChangeFileDecorations = new EventEmitter<Uri[]>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    provideFileDecoration(uri: Uri): ProviderResult<FileDecoration> {
        if (uri.scheme !== "ninja" && uri.authority !== "range") {
            return;
        }

        const uriStr = uri.toString();
        delete this._updated[uriStr];
        const info = this._treeItems[uriStr];
        if (info) {
            return {
                badge: info.remaining! < 10 ? `${info.remaining}` : undefined,
                color: new ThemeColor(Colors[`${info.severity}`]),
                tooltip: `${info.remaining} remaining`,
                propagate: info.propagate,
            };
        }
    }

    update() {
        this._onDidChangeFileDecorations.fire(
            Object.keys(this._updated).map(key => Uri.parse(key))
        );
    }

    markForUpdate(uriString: string, info: TreeItemInfo) {
        this._treeItems[uriString] = info;
        this._updated[uriString] = true;
    }
}
