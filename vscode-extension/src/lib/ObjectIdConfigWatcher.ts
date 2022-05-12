import { ObjIdConfig } from "./ObjIdConfig";
import { Disposable, Uri } from "vscode";
import { Backend } from "./Backend";
import { DOCUMENTS, LABELS } from "./constants";
import { FileWatcher } from "./FileWatcher";
import { showDocument } from "./functions";
import { Telemetry } from "./Telemetry";
import { UI } from "./UI";

type GetAppInfo = () => {
    name: string;
    hash: string;
};

export class ObjIdConfigWatcher implements Disposable {
    private readonly _configWatcher: FileWatcher;
    private readonly _created: Disposable;
    private readonly _changed: Disposable;
    private readonly _deleted: Disposable;
    private readonly _reload: () => ObjIdConfig;
    private readonly _getAppInfo: GetAppInfo;
    private _config: ObjIdConfig;
    private _disposed = false;

    public constructor(config: ObjIdConfig, getappInfo: GetAppInfo, reload: () => ObjIdConfig) {
        this._config = config;
        this._reload = reload;
        this._getAppInfo = getappInfo;
        this._configWatcher = new FileWatcher(config.uri);
        this._created = this._configWatcher.onCreated(() => this.onConfigCreated());
        this._changed = this._configWatcher.onChanged(gitEvent => this.onConfigChanged(gitEvent));
        this._deleted = this._configWatcher.onDeleted(gitEvent => this.onConfigDeleted(gitEvent));
    }

    private async onConfigCreated() {
        this._config = this._reload();
    }

    private async onConfigChanged(gitEvent: boolean) {
        const oldConfig = this._config;
        this._config = this._reload();
        if (oldConfig.authKey === this._config.authKey) {
            return;
        }

        const valid = await this._config.isAuthKeyValid();
        if (valid) {
            return;
        }

        const { name } = this._getAppInfo();
        if (gitEvent) {
            this.showUnauthorizedBranch(name);
            return;
        }

        this.showManualModificationWarning(name);
    }

    private async onConfigDeleted(gitEvent: boolean) {
        if ((await this._config.isAuthKeyValid()) && this._config.authKey) {
            const { hash, name } = this._getAppInfo();
            if (gitEvent) {
                this.showUnauthorizedBranch(name);
                return;
            }
            this.showDeletedAuthorizationError(hash, name);
        }
        this._config = this._reload();
    }

    private async showUnauthorizedBranch(name: string) {
        this.showWithDocumentation(
            UI.authorization.showUnauthorizedBranch(name),
            DOCUMENTS.AUTHORIZATION_BRANCH_CHANGE
        );
    }

    private async showDeletedAuthorizationError(hash: string, name: string) {
        Telemetry.instance.log("critical.objIdConfigDeleted", hash);
        this.showWithDocumentation(
            UI.authorization.showDeletedAuthorizationError(name),
            DOCUMENTS.AUTHORIZATION_DELETED
        );
    }

    private async showManualModificationWarning(name: string) {
        this.showWithDocumentation(
            UI.authorization.showManualModificationWarning(name),
            DOCUMENTS.AUTHORIZATION_MODIFIED
        );
    }

    private async showWithDocumentation(promise: Thenable<string | undefined>, document: string) {
        const response = await promise;
        if (response === LABELS.BUTTON_LEARN_MORE) {
            showDocument(document);
        }
    }

    public dispose() {
        if (this._disposed) {
            return;
        }

        this._disposed = true;
        this._created.dispose();
        this._changed.dispose();
        this._deleted.dispose();
        this._configWatcher.dispose();
    }
}
