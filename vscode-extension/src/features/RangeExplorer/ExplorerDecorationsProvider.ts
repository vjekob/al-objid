import {
    EventEmitter,
    FileDecoration,
    FileDecorationProvider,
    ProviderResult,
    ThemeColor,
    Uri,
} from "vscode";
import { PropertyBag } from "../../lib/PropertyBag";
import { AppManifest } from "../../lib/types";
import { TreeItemDecoration } from "../Explorer/TreeItemDecoration";
import { SeverityColors } from "../Explorer/TreeItemSeverity";

export class ExplorerDecorationsProvider implements FileDecorationProvider {
    private static _instance: ExplorerDecorationsProvider;
    private constructor() {}
    public static get instance() {
        return this._instance || (this._instance = new ExplorerDecorationsProvider());
    }

    private _decorations: PropertyBag<PropertyBag<TreeItemDecoration>> = {};

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
        }

        const map = this._decorations[uri.authority];
        map[uri.path] = decoration;
        this._onDidChangeFileDecorations.fire([uri]);
    }

    releaseDecorations(manifest: AppManifest) {
        delete this._decorations[manifest.id];
    }
}
