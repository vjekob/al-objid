import { env, ExtensionContext, extensions, Uri, window } from "vscode";
import { EXTENSION_NAME, LABELS } from "../lib/constants";
import { PropertyBag } from "../lib/PropertyBag";
import { DisposableHolder } from "./DisposableHolder";
import { output } from "./Output";

let appUpgradedV2 = false;
let oldVersion = false;

export class HttpGone extends DisposableHolder {
    private static _instance: HttpGone;
    private _context: ExtensionContext;

    public constructor(context: ExtensionContext) {
        super();
        if (HttpGone._instance) {
            throw new Error("Only a single instance of HttpGone class is allowed! Check the call stack and fix the problem.");
        }
        HttpGone._instance = this;
        this._context = context;
    }

    public static get instance() {
        return this._instance;
    }

    private async appUpgradedV2() {
        const response = await window.showErrorMessage(`Your app or all apps in your workspace have been upgraded to "v2" version of the back end. The "v2" version of the back end requires latest version of ${EXTENSION_NAME}, but you are using an older one. You must update ${EXTENSION_NAME} to v2.0.0 or newer.`, LABELS.BUTTON_LEARN_MORE);
        if (response === LABELS.BUTTON_LEARN_MORE) {
            env.openExternal(Uri.parse("https://vjeko.com/2021/10/01/important-announcement-for-al-object-id-ninja/"));
        }
    }

    private handlers: PropertyBag<Function> = {
        GENERIC: () => {
            output.log(`You are attempting to access a back-end endpoint that is no longer supported. Please update ${EXTENSION_NAME}.`);
            if (oldVersion) {
                return;
            }
            oldVersion = true;
            window.showWarningMessage(`You are using an old version of ${EXTENSION_NAME}. There is no major impact on the functionality, but you should consider updating to have access to all latest features.`, "OK");
        },

        OLD_VERSION: async () => {
            const version = extensions.getExtension("vjeko.vjeko-al-objid")?.packageJSON?.version;
            const stateKey = `warnings/OLD_VERSION/${version}`;
            const warned = this._context.globalState.get(stateKey);
            if (warned) {
                return;
            }
            this._context.globalState.update(stateKey, true);
            const response = await window.showWarningMessage(`You are using an old version of ${EXTENSION_NAME}, and a back-end feature you called is no longer available. Please update ${EXTENSION_NAME} to the latest version.`, "OK", LABELS.BUTTON_LEARN_MORE);
            if (response === LABELS.BUTTON_LEARN_MORE) {
                env.openExternal(Uri.parse("https://vjeko.com/why-is-using-old-versions-of-al-object-id-ninja-not-a-good-idea/"));
            }
        },

        APP_UPGRADED_V2: () => {
            if (appUpgradedV2) {
                return;
            }

            appUpgradedV2 = true;
            this.appUpgradedV2();
        }
    }

    public handleError(error: string) {
        let match = error.match(/\[STATUS_REASON=(?<reason>.+?)\]/);
        let reason = "GENERIC";
        if (match && match.groups && typeof match.groups.reason === "string") {
            if (typeof this.handlers[match.groups.reason] === "function") {
                reason = match.groups.reason;
            }
        }
        this.handlers[reason]();
    }
}
