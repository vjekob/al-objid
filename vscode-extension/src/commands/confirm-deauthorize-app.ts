import { commands, env, Uri, window } from "vscode";
import { URLS } from "../lib/constants";
import openExternal from "../lib/functions/openExternal";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

const OPTION = {
    YES: "Yes, I am sure about it",
    NO: "No, I've changed my mind",
    LEARN: "I am not sure, tell me more about authorization",
};

async function executeDeuthorization() {
    commands.executeCommand(NinjaCommand.DeauthorizeApp);
}

export const confirmDeauthorizeApp = async () => {
    Telemetry.instance.logCommand(NinjaCommand.ConfirmDeauthorizeApp);

    let result = await window.showQuickPick(Object.values(OPTION), {
        placeHolder: "Are you sure you want to deauthorize your app?",
    });
    switch (result) {
        case OPTION.YES:
            executeDeuthorization();
            break;
        case OPTION.LEARN:
            openExternal(URLS.AUTHORIZATION_LEARN);
            break;
    }
};
