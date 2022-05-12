import * as path from "path";
import * as fs from "fs";
import { Disposable, Uri, WorkspaceFolder } from "vscode";
import { getSha256 } from "./Sha256";
import { ALAppManifest } from "./ALAppManifest";
import { ObjIdConfig } from "./ObjIdConfig";
import { APP_FILE_NAME, CONFIG_FILE_NAME } from "./constants";
import { output } from "../features/Output";
import { FileWatcher } from "./FileWatcher";
import { ObjIdConfigWatcher } from "./ObjectIdConfigWatcher";

export class ALApp implements Disposable {
    private readonly _rootUri: Uri;
    private readonly _configUri: Uri;
    private readonly _manifestWatcher: FileWatcher;
    private readonly _manifestChanged: Disposable;
    private readonly _configWatcher: ObjIdConfigWatcher;
    private _diposed = false;
    private _manifest: ALAppManifest;
    private _config: ObjIdConfig;
    private _hash: string | undefined;
    private _encryptionKey: string | undefined;

    private constructor(rootUri: Uri, manifest: ALAppManifest) {
        this._rootUri = rootUri;
        this._manifest = manifest;
        this._manifest.uri;
        this._configUri = Uri.file(path.join(rootUri.fsPath, CONFIG_FILE_NAME));
        this._config = new ObjIdConfig(this._configUri, this.hash);

        this._manifestWatcher = new FileWatcher(manifest.uri);
        this._manifestChanged = this._manifestWatcher.onChanged(() => this.onManifestChanged());

        this._configWatcher = new ObjIdConfigWatcher(
            this._config,
            () => ({
                hash: this.hash,
                name: this._manifest.name,
            }),
            () => (this._config = new ObjIdConfig(this._configUri, this.hash))
        );
    }

    private onManifestChanged() {
        output.log(`Change detected on ${this._manifest.uri.fsPath}`);
        const manifest = ALAppManifest.tryCreate(this._manifest.uri);
        if (manifest) {
            if (manifest.id !== this._manifest.id) {
                output.log(
                    `Manifest id changed from ${this._manifest.id} to ${manifest.id}, resetting hash and encryption key.`
                );
                this._hash = undefined;
                this._encryptionKey = undefined;
            }
            this._manifest = manifest;
        }
    }

    public static tryCreate(folder: WorkspaceFolder): ALApp | undefined {
        const rootUri = folder.uri;
        const manifestUri = Uri.file(path.join(rootUri.fsPath, APP_FILE_NAME));
        if (!fs.existsSync(manifestUri.fsPath)) {
            return;
        }

        const manifest = ALAppManifest.tryCreate(manifestUri);
        return manifest && new ALApp(rootUri, manifest);
    }

    public get manifest() {
        return this._manifest;
    }

    public get config() {
        return this._config;
    }

    public get hash() {
        return this._hash || (this._hash = getSha256(this._manifest.id));
    }

    public get encryptionKey() {
        if (this._encryptionKey) {
            return this._encryptionKey;
        }

        const key = getSha256(this._manifest.id.replace("-", ""));
        const first = key[0];
        const numeric = parseInt(first, 16);
        this._encryptionKey = key.substring(numeric, numeric + 32);
        return this._encryptionKey;
    }

    public dispose() {
        if (this._diposed) {
            return;
        }
        this._diposed = true;
        this._manifestChanged.dispose();
        this._manifestWatcher.dispose();
        this._configWatcher.dispose();
    }
}
