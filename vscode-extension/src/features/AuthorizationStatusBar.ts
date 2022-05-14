import { MarkdownString, StatusBarAlignment, StatusBarItem, window } from "vscode";
import { EXTENSION_NAME, URLS } from "../lib/constants";
import { DisposableHolder } from "./DisposableHolder";
import { Backend } from "../lib/backend/Backend";
import { AuthorizedAppResponse } from "../lib/backend/AuthorizedAppResponse";
import { WorkspaceManager } from "./WorkspaceManager";
import { ALApp } from "../lib/ALApp";
import { NinjaCommand } from "../commands/commands";

export class AuthorizationStatusBar extends DisposableHolder {
    private _status: StatusBarItem;
    private static _instance: AuthorizationStatusBar;

    private constructor() {
        super();
        this.registerDisposable((this._status = window.createStatusBarItem(StatusBarAlignment.Left, 1)));
        window.onDidChangeActiveTextEditor(this.updateStatusBar, this);
    }

    public static get instance(): AuthorizationStatusBar {
        return this._instance || (this._instance = new AuthorizationStatusBar());
    }

    private updateTooltip(name: string, authorized: boolean, userInfo: string) {
        this._status.tooltip = authorized
            ? new MarkdownString(
                  `The "${name}" application is ***authorized*** with ${EXTENSION_NAME} back end. Your data exchange is secure.${
                      userInfo ? " " + `\n\nAuthorized by ${userInfo}` : ""
                  }`
              )
            : new MarkdownString(
                  `The "${name}" application is ***not authorized***.\n\nTo authorize your app, please run the \`Ninja: Authorize AL App\` command or click this status bar item.\n\nTo learn more about authorization [click here](${URLS.AUTHORIZATION_LEARN})`
              );
    }

    private getUserInfoText(info: AuthorizedAppResponse | undefined) {
        return info && info.user && info.user.name
            ? `${info.user.name} ${info.user.email ? `(${info.user.email})` : ""} at ${new Date(
                  info.user.timestamp
              ).toLocaleString()}`
            : "";
    }

    private async readUserInfo(app: ALApp, authKey: string) {
        const authorized = !!authKey;
        // TODO Use app.config.isValid rather than accessing back end again
        const info = await Backend.getAuthInfo(app, authKey);
        if (info) {
            if (info.authorized === authorized) {
                if (!info.valid && info.authorized) {
                    this._status.text = `$(error) Invalid authorization`;
                    this._status.tooltip = new MarkdownString(
                        "Your authorization is ***invalid***. The authorization key stored in `.objidconfig` is not accepted by the back end. If you switched branches, make sure the current branch has the latest `.objidconfig` from your main branch."
                    );
                    return;
                }
                this.updateTooltip(app!.name, authorized, this.getUserInfoText(info));
            } else {
                this._status.text = `$(${authorized ? "warning" : "error"}) Invalid authorization`;
                this._status.tooltip = new MarkdownString(
                    `Your authorization is ***invalid***. ${
                        authorized
                            ? "You have authorization file (`.objidconfig`) but the app is not authorized."
                            : "You have no authorization file (`.objidconfig`), but the app is authorized."
                    } Try to pull latest changes from your Git.${
                        info && info.user ? `\n\nThis app was last authorized by ${this.getUserInfoText(info)}` : ""
                    }`
                );
            }
        }
    }

    public updateStatusBar() {
        let document = window.activeTextEditor?.document;
        if (!document || !WorkspaceManager.instance.isALUri(document.uri)) {
            this._status.hide();
            return;
        }

        let manifest = WorkspaceManager.instance.getALAppFromUri(document.uri)!;
        let authKey = manifest?.config.authKey;

        if (manifest) {
            this.readUserInfo(manifest, authKey);
        }

        this._status.text = `$(${authKey ? "lock" : "unlock"}) ${authKey ? "Authorized" : "Unauthorized"}`;
        this._status.command = authKey ? undefined : NinjaCommand.ConfirmAuthorizeApp;
        this.updateTooltip(manifest!.name, !!authKey, "");
        this._status.show();
    }

    protected override prepareDisposables() {
        this.updateStatusBar();
    }
}
