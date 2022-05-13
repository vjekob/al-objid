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
import { decrypt, encrypt } from "./Encryption";

export class ALApp implements Disposable {
    private readonly _uri: Uri;
    private readonly _configUri: Uri;
    private readonly _manifestWatcher: FileWatcher;
    private readonly _manifestChanged: Disposable;
    private readonly _configWatcher: ObjIdConfigWatcher;
    private _diposed = false;
    private _manifest: ALAppManifest;
    private _config: ObjIdConfig;
    private _hash: string | undefined;
    private _encryptionKey: string | undefined;

    private constructor(uri: Uri, manifest: ALAppManifest) {
        this._uri = uri;
        this._manifest = manifest;
        this._manifest.uri;
        this._configUri = Uri.file(path.join(uri.fsPath, CONFIG_FILE_NAME));
        this._config = new ObjIdConfig(this._configUri, this.hash);

        this._manifestWatcher = new FileWatcher(manifest.uri);
        this._manifestChanged = this._manifestWatcher.onChanged(() => this.onManifestChanged());

        this._configWatcher = new ObjIdConfigWatcher(
            this._config,
            () => ({
                hash: this.hash,
                name: this._manifest.name,
            }),
            () => this.setUpConfigFile()
        );
    }

    private onManifestChanged() {
        output.log(`Change detected on ${this._manifest.uri.fsPath}`);
        const manifest = ALAppManifest.tryCreate(this._manifest.uri);
        if (manifest) {
            const oldId = this._manifest.id;
            this._manifest = manifest;
            if (manifest.id !== oldId) {
                output.log(
                    `Manifest id changed from ${oldId} to ${manifest.id}, resetting hash and encryption key.`
                );
                this._hash = undefined;
                this._encryptionKey = undefined;
                this._configWatcher.updateConfigAfterAppIdChange(this.setUpConfigFile());
            }
        }
    }

    private setUpConfigFile(): ObjIdConfig {
        return (this._config = new ObjIdConfig(this._configUri, this.hash));
    }

    public static tryCreate(folder: WorkspaceFolder): ALApp | undefined {
        const uri = folder.uri;
        const manifestUri = Uri.file(path.join(uri.fsPath, APP_FILE_NAME));
        if (!fs.existsSync(manifestUri.fsPath)) {
            return;
        }

        const manifest = ALAppManifest.tryCreate(manifestUri);
        return manifest && new ALApp(uri, manifest);
    }

    /**
     * URI of the folder (root) of this AL app.
     */
    public get uri() {
        return this._uri;
    }

    /**
     * App manifest (`app.json`) representation as an object. This object is read-only.
     */
    public get manifest() {
        return this._manifest;
    }

    /**
     * Ninja config file (`.objidconfig`) representation as an object. This object is read/write.
     * Any changes you make to its public properties will be persisted to the underlying
     * `.objidconfig` file.
     */
    public get config() {
        return this._config;
    }

    /**
     * SHA256 hash of the app ID (the `id` property from `app.json`). This property is needed for
     * identifying the app for most purposes throughout Ninja.
     */
    public get hash() {
        return this._hash || (this._hash = getSha256(this._manifest.id));
    }

    /**
     * Encryption key of the app ID, to be used for encrypting potentially sensitive information
     * during back-end communication. Never send 
     */
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

    /**
     * Encrypts a string using the app encryption key.
     * @param value String to encrypt
     * @returns Encrypted string (or `undefined` if encryption failed)
     */
    public encrypt(value: string): string | undefined {
        return encrypt(value, this.encryptionKey);
    }

    /**
     * Decrypts a string using the app encryption key.
     * @param value String to decrypt
     * @returns Decrypted string (or `undefined` if decryption failed)
     */
    public decrypt(value: string): string | undefined {
        return decrypt(value, this.encryptionKey);
    }

    /**
     * Checks if this ALApp instance represents the specified workspace folder.
     * @param folder Workspace folder for which to check if this ALApp instance represents it.
     * @returns Boolean value indicating whether this ALApp instance represents the specified workspace folder.
     */
    public isFolder(folder: WorkspaceFolder): boolean {
        if (folder.uri.scheme !== this._uri.scheme) {
            return false;
        }

        return folder.uri.fsPath == this._uri.fsPath;
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
