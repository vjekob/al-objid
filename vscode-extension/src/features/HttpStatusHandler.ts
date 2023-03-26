import { env, ExtensionContext, Uri, window } from "vscode";
import { EXTENSION_NAME, EXTENSION_VERSION, LABELS } from "../lib/constants";
import openExternal from "../lib/functions/openExternal";
import { PropertyBag } from "../lib/types/PropertyBag";
import { DisposableHolder } from "./DisposableHolder";
import { LogLevel, output } from "./Output";

let appUpgradedV2 = false;
let oldVersion = false;
let maintenance = false;

export class HttpStatusHandler extends DisposableHolder {
    private static _instance: HttpStatusHandler;
    private _context: ExtensionContext;

    public constructor(context: ExtensionContext) {
        super();
        if (HttpStatusHandler._instance) {
            throw new Error(
                "Only a single instance of HttpGone class is allowed! Check the call stack and fix the problem."
            );
        }
        HttpStatusHandler._instance = this;
        this._context = context;
    }

    public static get instance() {
        return this._instance;
    }

    //#region 410 Gone

    private async appUpgradedV2() {
        const response = await window.showErrorMessage(
            `Your app or all apps in your workspace have been upgraded to "v2" version of the back end. The "v2" version of the back end requires latest version of ${EXTENSION_NAME}, but you are using an older one. You must update ${EXTENSION_NAME} to v2.0.0 or newer.`,
            LABELS.BUTTON_LEARN_MORE
        );
        if (response === LABELS.BUTTON_LEARN_MORE) {
            openExternal("https://vjeko.com/2021/10/01/important-announcement-for-al-object-id-ninja/");
        }
    }

    private handlers410: PropertyBag<Function> = {
        GENERIC: () => {
            output.log(
                `You are attempting to access a back-end endpoint that is no longer supported. Please update ${EXTENSION_NAME}.`,
                LogLevel.Info
            );
            if (oldVersion) {
                return;
            }
            oldVersion = true;
            window.showWarningMessage(
                `You are using an old version of ${EXTENSION_NAME}. There is no major impact on the functionality, but you should consider updating to have access to all latest features.`,
                "OK"
            );
        },

        OLD_VERSION: async () => {
            const stateKey = `warnings/OLD_VERSION/${EXTENSION_VERSION}`;
            const warned = this._context.globalState.get(stateKey);
            if (warned) {
                return;
            }
            output.log(`You are using an old version of ${EXTENSION_NAME}.`, LogLevel.Info);
            this._context.globalState.update(stateKey, true);
            const response = await window.showWarningMessage(
                `You are using an old version of ${EXTENSION_NAME}, and a back-end feature you called is no longer available. Please update ${EXTENSION_NAME} to the latest version.`,
                "OK",
                LABELS.BUTTON_LEARN_MORE
            );
            if (response === LABELS.BUTTON_LEARN_MORE) {
                openExternal("https://vjeko.com/why-is-using-old-versions-of-al-object-id-ninja-not-a-good-idea/");
            }
        },

        APP_UPGRADED_V2: () => {
            if (appUpgradedV2) {
                return;
            }

            appUpgradedV2 = true;
            this.appUpgradedV2();
        },
    };

    public handleError410(error: string) {
        let match = error.match(/\[STATUS_REASON=(?<reason>.+?)\]/);
        let reason = "GENERIC";
        if (match && match.groups && typeof match.groups.reason === "string") {
            if (typeof this.handlers410[match.groups.reason] === "function") {
                reason = match.groups.reason;
            }
        }
        this.handlers410[reason]();
    }

    //#endregion

    //#region  503 Service Unavailable

    public async handleError503(error: any) {
        if (maintenance) {
            return;
        }
        const date = new Date(error.headers["retry-after"]);
        const diff = date.valueOf() - Date.now();

        if (!diff || diff < 0) {
            // This is not a scheduled maintenance, but a temporary outage.
            return;
        }

        maintenance = true;

        let buttons = ["OK"];
        if (typeof error.error === "string" && error.error.toLowerCase().startsWith("http")) {
            buttons.push(LABELS.BUTTON_LEARN_MORE);
        }
        let response = await window.showInformationMessage(
            `AL Object ID Ninja back end is currently undergoing scheduled maintenance. It will be ready again in ${Math.ceil(
                diff / 60000
            )} minute(s).`,
            "OK",
            LABELS.BUTTON_LEARN_MORE
        );
        if (response === LABELS.BUTTON_LEARN_MORE) {
            openExternal(error.error.toLowerCase());
        }
    }

    //#endregion
}
