import { EventEmitter, FileDecoration, FileDecorationProvider, ProviderResult, ThemeColor, Uri } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { TreeItemDecoration } from "../Explorer/TreeItemDecoration";
import { SeverityColors } from "../Explorer/TreeItemSeverity";

export class ExplorerDecorationsProvider implements FileDecorationProvider {
    private static _instance: ExplorerDecorationsProvider;
    private constructor() {}
    public static get instance() {
        return this._instance || (this._instance = new ExplorerDecorationsProvider());
    }

    private readonly _decorations: PropertyBag<PropertyBag<TreeItemDecoration>> = {};
    private readonly _uriMap: PropertyBag<Uri[]> = {};

    private _onDidChangeFileDecorations = new EventEmitter<Uri[]>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    provideFileDecoration(uri: Uri): ProviderResult<FileDecoration> {
        if (uri.scheme !== "ninja") {
            return;
        }

        const map = this._decorations[uri.authority];
        if (!map) {
            return;
        }

        const decoration = map[uri.path];
        if (!decoration) {
            return;
        }

        return {
            ...decoration,
            propagate: false,
            color: new ThemeColor(SeverityColors[`${decoration.severity}`]),
        };
    }

    decorate(uri: Uri, decoration: TreeItemDecoration) {
        if (!this._decorations[uri.authority]) {
            this._decorations[uri.authority] = {};
            this._uriMap[uri.authority] = [];
        }

        const map = this._decorations[uri.authority];
        const uriMap = this._uriMap[uri.authority];
        map[uri.path] = decoration;
        uriMap.push(uri);
        this._onDidChangeFileDecorations.fire([uri]);
    }

    releaseDecorations(app: ALApp) {
        const uris = this._uriMap[app.hash];
        delete this._decorations[app.hash];
        delete this._uriMap[app.hash];
        if (uris.length > 0) {
            this._onDidChangeFileDecorations.fire(uris);
        }
    }
}
