import { ALApp } from "../../../lib/ALApp";
import { DecorationsProvider } from "../DecorationsProvider";

export class AppDecorationsProvider extends DecorationsProvider {
    public releaseDecorations(app: ALApp) {
        const uris = this._uriMap[app.hash] || [];
        delete this._decorations[app.hash];
        delete this._uriMap[app.hash];
        if (uris.length > 0) {
            this._onDidChangeFileDecorations.fire(uris);
        }
    }
}
