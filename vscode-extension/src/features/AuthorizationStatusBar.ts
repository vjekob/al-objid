import { MarkdownString, StatusBarAlignment, StatusBarItem, window } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/__AppManifest_obsolete_";
import { EXTENSION_NAME, URLS } from "../lib/constants";
import { DisposableHolder } from "./DisposableHolder";
import { Backend } from "../lib/Backend";
import { AuthorizedAppResponse } from "../lib/BackendTypes";
import { __AppManifest_obsolete_ } from "../lib/types";

export class AuthorizationStatusBar extends DisposableHolder {
    private _status: StatusBarItem;
    private static _instance: AuthorizationStatusBar;

    private constructor() {
        super();
        this.registerDisposable(
            (this._status = window.createStatusBarItem(StatusBarAlignment.Left, 1))
        );
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

    private async readUserInfo(manifest: __AppManifest_obsolete_, authKey: string) {
        const authorized = !!authKey;
        const info = await Backend.getAuthInfo(manifest.id, authKey);
        if (info) {
            if (info.authorized === authorized) {
                if (!info.valid && info.authorized) {
                    this._status.text = `$(error) Invalid authorization`;
                    this._status.tooltip = new MarkdownString(
                        "Your authorization is ***invalid***. The authorization key stored in `.objidconfig` is not accepted by the back end. If you switched branches, make sure the current branch has the latest `.objidconfig` from your main branch."
                    );
                    return;
                }
                this.updateTooltip(manifest!.name, authorized, this.getUserInfoText(info));
            } else {
                this._status.text = `$(${authorized ? "warning" : "error"}) Invalid authorization`;
                this._status.tooltip = new MarkdownString(
                    `Your authorization is ***invalid***. ${
                        authorized
                            ? "You have authorization file (`.objidconfig`) but the app is not authorized."
                            : "You have no authorization file (`.objidconfig`), but the app is authorized."
                    } Try to pull latest changes from your Git.${
                        info && info.user
                            ? `\n\nThis app was last authorized by ${this.getUserInfoText(info)}`
                            : ""
                    }`
                );
            }
        }
    }

    public updateStatusBar() {
        let document = window.activeTextEditor?.document;
        if (!document || !ALWorkspace.isALWorkspace(document.uri)) {
            this._status.hide();
            return;
        }

        let manifest = getManifest(document.uri)!;
        let authKey = manifest?.ninja.config?.authKey;

        if (manifest) {
            this.readUserInfo(manifest, authKey);
        }

        this._status.text = `$(${authKey ? "lock" : "unlock"}) ${
            authKey ? "Authorized" : "Unauthorized"
        }`;
        this._status.command = authKey ? undefined : "vjeko-al-objid.confirm-authorize-app";
        this.updateTooltip(manifest!.name, !!authKey, "");
        this._status.show();
    }

    protected override prepareDisposables() {
        this.updateStatusBar();
    }
}
