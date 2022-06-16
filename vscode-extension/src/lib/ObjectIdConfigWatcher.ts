import { ObjIdConfig } from "./ObjIdConfig";
import { Disposable, workspace } from "vscode";
import { DOCUMENTS, LABELS } from "./constants";
import { FileWatcher } from "./FileWatcher";
import { showDocument } from "./functions/showDocument";
import { Telemetry, TelemetryEventType } from "./Telemetry";
import { UI } from "./UI";
import { ObjIdConfigLinter } from "../features/linters/ObjIdConfigLinter";
import { ALApp } from "./ALApp";

type GetAppInfo = () => ALApp;

export class ObjIdConfigWatcher implements Disposable {
    private readonly _configWatcher: FileWatcher;
    private readonly _created: Disposable;
    private readonly _changed: Disposable;
    private readonly _deleted: Disposable;
    private readonly _edited: Disposable;
    private readonly _reload: () => ObjIdConfig;
    private readonly _getAppInfo: GetAppInfo;
    private _config: ObjIdConfig;
    private _timeout: NodeJS.Timeout | undefined;
    private _disposed = false;

    public constructor(config: ObjIdConfig, getappInfo: GetAppInfo, reload: () => ObjIdConfig) {
        this._config = config;
        this._reload = reload;
        this._getAppInfo = getappInfo;
        this._configWatcher = new FileWatcher(config.uri);
        this._created = this._configWatcher.onCreated(() => this.onConfigCreated());
        this._changed = this._configWatcher.onChanged(gitEvent => this.onConfigChanged(gitEvent));
        this._deleted = this._configWatcher.onDeleted(gitEvent => this.onConfigDeleted(gitEvent));
        this._edited = workspace.onDidChangeTextDocument(
            e => e.document.uri.fsPath === this._config.uri.fsPath && this.onEdited()
        );
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
            const app = this._getAppInfo();
            if (gitEvent) {
                this.showUnauthorizedBranch(app.name);
                return;
            }
            this.showDeletedAuthorizationError(app);
        }
        this._config = this._reload();
    }

    private onEdited() {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }

        this._timeout = setTimeout(() => {
            const linter = new ObjIdConfigLinter(this._config.uri);
            linter.validate();
        }, 250);
    }

    private async showUnauthorizedBranch(name: string) {
        this.showWithDocumentation(
            UI.authorization.showUnauthorizedBranchWarning(name),
            DOCUMENTS.AUTHORIZATION_BRANCH_CHANGE
        );
    }

    private async showDeletedAuthorizationError(app: ALApp) {
        Telemetry.instance.log(TelemetryEventType.ObjIdConfigDeleted, app);
        this.showWithDocumentation(
            UI.authorization.showDeletedAuthorizationError(app.name),
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

    public async updateConfigAfterAppIdChange(config: ObjIdConfig) {
        this._config = config;
        if (!this._config.authKey) {
            return;
        }

        const valid = await this._config.isAuthKeyValid();
        if (valid) {
            return;
        }

        const { name } = this._getAppInfo();
        this.showWithDocumentation(UI.authorization.showAppIdChangedWarning(name), DOCUMENTS.APP_ID_CHANGE);
    }

    public dispose() {
        if (this._disposed) {
            return;
        }

        this._disposed = true;
        this._created.dispose();
        this._changed.dispose();
        this._deleted.dispose();
        this._edited.dispose();
        this._configWatcher.dispose();
    }
}
