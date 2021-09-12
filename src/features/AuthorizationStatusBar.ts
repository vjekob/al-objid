import { MarkdownString, StatusBarAlignment, StatusBarItem, window } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { ObjIdConfig } from "../lib/ObjIdConfig";
import { EXTENSION_NAME, URLS } from "../lib/constants";
import { DisposableHolder } from "./DisposableHolder";

export class AuthorizationStatusBar extends DisposableHolder {
    private _status: StatusBarItem;
    private static _instance: AuthorizationStatusBar;

    private constructor() {
        super();
        this.registerDisposable(this._status = window.createStatusBarItem(StatusBarAlignment.Left, 1));
        this.registerDisposable(window.onDidChangeActiveTextEditor(() => this.updateStatusBar));
    }

    public static get instance(): AuthorizationStatusBar {
        return this._instance || (this._instance = new AuthorizationStatusBar());
    }

    public updateStatusBar() {
        let document = window.activeTextEditor?.document;
        if (!document || !ALWorkspace.isALWorkspace(document.uri)) {
            this._status.hide();
            return;
        }

        let { authKey } = ObjIdConfig.instance(document.uri);
        let manifest = getManifest(document.uri);

        this._status.text = `$(${authKey ? "lock" : "unlock"}) ${authKey ? "Authorized" : "Unauthorized"}`;
        this._status.command = authKey ? undefined : "vjeko-al-objid.confirm-authorize-app";
        this._status.tooltip = authKey
            ? new MarkdownString(`The "${manifest!.name}" application is ***authorized*** with ${EXTENSION_NAME} back end. Your data exchange is secure.`)
            : new MarkdownString(`The "${manifest!.name}" application is ***not authorized***.\n\nTo authorize your app, please run the \`Vjeko: Authorize AL App\` command or click this status bar item.\n\nTo learn more about authorization [click here](${URLS.AUTHORIZATION_LEARN})`);
        this._status.show();
    }

    protected override prepareDisposables() {
        this.updateStatusBar();
    };
}
