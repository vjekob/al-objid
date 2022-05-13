import * as fs from "fs";
import { Uri } from "vscode";
import { ALRange } from "./types/ALRange";

interface ALAppJson {
    id: string;
    name: string;
    version: string;
    idRanges: ALRange[];
    preprocessorSymbols: string[];
}

export class ALAppManifest {
    private readonly _uri: Uri;
    private readonly _manifest: ALAppJson;

    private constructor(uri: Uri, manifest: ALAppJson) {
        this._uri = uri;
        this._manifest = manifest;
    }

    public static tryCreate(uri: Uri): ALAppManifest | undefined {
        try {
            const contents = fs.readFileSync(uri.fsPath).toString();
            const appObj = JSON.parse(contents);

            const expectProperty = (property: string, type = "string") =>
                appObj.hasOwnProperty(property) && typeof appObj[property] === type;
            if (!expectProperty("id") || !expectProperty("name") || !expectProperty("version")) {
                return;
            }

            if (!appObj.idRanges && appObj.idRange) {
                appObj.idRanges = [appObj.idRange];
            }
            if (!expectProperty("idRanges", "object")) {
                return;
            }

            return new ALAppManifest(uri, appObj);
        } catch {
            return;
        }
    }

    /**
     * Uri of the `app.json` file.
     */
    public get uri() {
        return this._uri;
    }

    /**
     * The `id` property from the `app.json` file.
     *
     * ***DO NOT USE THIS PROPERTY UNLESS YOU ABSOLUTELY NEED IT!***
     *
     * **Instead, use the `hash` property from the parent object. The `id` property should be used
     * only for informational purposes, typically when having to present it on screen.**
     *
     * ***NEVER SEND THIS PROPERTY TO THE BACK END!***
     */
    public get id(): string {
        return this._manifest.id || "";
    }

    /**
     * The `name` property from the `app.json` file.
     */
    public get name(): string {
        return this._manifest.name || "";
    }

    /**
     * The `version` property from the `app.json` file.
     */
    public get version(): string {
        return this._manifest.version || "";
    }

    /**
     * The `idRanges` property from the `app.json` file.
     */
    public get idRanges(): ALRange[] {
        return this._manifest.idRanges || [];
    }

    public get preprocessorSymbols(): string[] {
        return this._manifest.preprocessorSymbols || [];
    }
}
