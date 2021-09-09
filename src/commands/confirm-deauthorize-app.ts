import { commands, env, Uri, window } from "vscode";
import { URLS } from "../lib/constants";

const OPTION = {
    YES: "Yes, I am sure about it",
    NO: "No, I've changed my mind",
    LEARN: "I am not sure, tell me more about authorization",
};

export const confirmDeauthorizeApp = async () => {
    let result = await window.showQuickPick(Object.values(OPTION), {
        placeHolder: "Are you sure you want to deauthorize your app?"
    });
    switch (result) {
        case OPTION.YES:
            commands.executeCommand("vjeko-al-objid.deauthorize-app");
            break;
        case OPTION.LEARN:
            env.openExternal(Uri.parse(URLS.AUTHORIZATON_LEARN));
            break;   
    }
};
