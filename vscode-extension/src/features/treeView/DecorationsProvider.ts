import { EventEmitter, FileDecoration, FileDecorationProvider, ProviderResult, ThemeColor, Uri } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { Decoration } from "./Decoration";
import { SeverityColors } from "./DecorationSeverity";

export class DecorationsProvider implements FileDecorationProvider {
    private readonly _decorations: PropertyBag<PropertyBag<Decoration>> = {};
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

    public decorate(uri: Uri, decoration: Decoration) {
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

    public releaseDecorations(app: ALApp) {
        const uris = this._uriMap[app.hash] || [];
        delete this._decorations[app.hash];
        delete this._uriMap[app.hash];
        if (uris.length > 0) {
            this._onDidChangeFileDecorations.fire(uris);
        }
    }
}
