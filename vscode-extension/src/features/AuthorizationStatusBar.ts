import { MarkdownString, StatusBarAlignment, StatusBarItem, window } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { AppManifest, getManifest } from "../lib/AppManifest";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { EXTENSION_NAME, URLS } from "../lib/constants";
import { DisposableHolder } from "./DisposableHolder";
import { Backend } from "../lib/Backend";
import { AuthorizedAppResponse } from "../lib/BackendTypes";

export class AuthorizationStatusBar extends DisposableHolder {
    private _status: StatusBarItem;
    private static _instance: AuthorizationStatusBar;

    private constructor() {
        super();
        this.registerDisposable(this._status = window.createStatusBarItem(StatusBarAlignment.Left, 1));
        window.onDidChangeActiveTextEditor(this.updateStatusBar, this);
    }

    public static get instance(): AuthorizationStatusBar {
        return this._instance || (this._instance = new AuthorizationStatusBar());
    }

    private updateTooltip(name: string, authorized: boolean, userInfo: string) {
        this._status.tooltip = authorized
            ? new MarkdownString(`The "${name}" application is ***authorized*** with ${EXTENSION_NAME} back end. Your data exchange is secure.${userInfo ? " " + `\n\nAuthorized by ${userInfo}` : ""}`)
            : new MarkdownString(`The "${name}" application is ***not authorized***.\n\nTo authorize your app, please run the \`Vjeko: Authorize AL App\` command or click this status bar item.\n\nTo learn more about authorization [click here](${URLS.AUTHORIZATION_LEARN})`);
    }

    private getUserInfoText(info: AuthorizedAppResponse | undefined) {
        return info && info.user ? `${info.user.name} (${info.user.email}) at ${new Date(info.user.timestamp).toLocaleString()}` : "";
    }

    private async readUserInfo(manifest: AppManifest, authorized: boolean) {
        const info = await Backend.getAuthInfo(manifest.id);
        if (info) {
            if (info.authorized === authorized) {
                this.updateTooltip(manifest!.name, authorized, this.getUserInfoText(info));
            } else {
                this._status.text = `$(${authorized ? "warning" : "error"}) Invalid authorization`;
                this._status.tooltip = new MarkdownString(`Your authorization is ***invalid***. ${authorized ? "You have authorization file (`.objidconfig`) but the app is not authorized." : "You have no authorization file (`.objidconfig`), but the app is authorized."} Try to pull latest changes from your Git.${info && info.user ? `\n\nThis app was last authorized by ${this.getUserInfoText(info)}` : ""}`);
            }
        }
    }

    public updateStatusBar() {
        let document = window.activeTextEditor?.document;
        if (!document || !ALWorkspace.isALWorkspace(document.uri)) {
            this._status.hide();
            return;
        }

        let { authKey } = ObjIdConfig.instance(document.uri);
        let manifest = getManifest(document.uri);

        if (manifest) {
            this.readUserInfo(manifest, !!authKey);
        }

        this._status.text = `$(${authKey ? "lock" : "unlock"}) ${authKey ? "Authorized" : "Unauthorized"}`;
        this._status.command = authKey ? undefined : "vjeko-al-objid.confirm-authorize-app";
        this.updateTooltip(manifest!.name, !!authKey, "");
        this._status.show();
    }

    protected override prepareDisposables() {
        this.updateStatusBar();
    };
}
