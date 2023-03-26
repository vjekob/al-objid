import { commands, env, Uri, window } from "vscode";
import { URLS } from "../lib/constants";
import openExternal from "../lib/functions/openExternal";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

const OPTION = {
    YES: "Yes, authorize the app and make it more secure",
    NO: "No, I've changed my mind",
    LEARN: "I am not sure, tell me more about authorization",
};

const OPTION_AGAIN = {
    YES: "Yes, I am sure, please let's authorize this app",
    NO: "No, I've changed my mind",
    LEARN: "I am actually not sure, show me documentation",
};

async function executeAuthorization() {
    commands.executeCommand(NinjaCommand.AuthorizeApp);
}

async function confirmAgain() {
    let result = await window.showQuickPick(Object.values(OPTION_AGAIN), {
        placeHolder: "Sorry for asking, but are you *REALLY* sure?",
    });
    switch (result) {
        case OPTION_AGAIN.YES:
            await executeAuthorization();
            break;
        case OPTION_AGAIN.NO:
            Telemetry.instance.logCommand(NinjaCommand.ConfirmAuthorizeApp, { confirmAgain: "no" });
            break;
        case OPTION_AGAIN.LEARN:
            openExternal(URLS.AUTHORIZATION_LEARN);
            break;
    }
}

export const confirmAuthorizeApp = async (fromStatusBar: boolean = false) => {
    Telemetry.instance.logCommand(NinjaCommand.ConfirmAuthorizeApp, { fromStatusBar });

    let result = await window.showQuickPick(Object.values(OPTION), {
        placeHolder: "Are you sure you want to authorize your app?",
    });
    switch (result) {
        case OPTION.YES:
            confirmAgain();
            break;
        case OPTION.LEARN:
            openExternal(URLS.AUTHORIZATION_LEARN);
            break;
    }
};
