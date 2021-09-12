import { commands, env, Uri, window } from "vscode";
import { URLS } from "../lib/constants";

const OPTION = {
    YES: "Yes, authorize the app and make it more secure",
    NO: "No, I've changed my mind",
    LEARN: "I am not sure, tell me more about authorization",
};

export const confirmAuthorizeApp = async () => {
    let result = await window.showQuickPick(Object.values(OPTION), {
        placeHolder: "Are you sure you want to authorize your app?"
    });
    switch (result) {
        case OPTION.YES:
            commands.executeCommand("vjeko-al-objid.authorize-app");
            break;
        case OPTION.LEARN:
            env.openExternal(Uri.parse(URLS.AUTHORIZATION_LEARN));
            break;   
    }
};
