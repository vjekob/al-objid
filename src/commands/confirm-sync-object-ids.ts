import { commands, env, Uri, window } from "vscode";
import { URLS } from "../lib/constants";

const OPTION = {
    YES: "Yes, overwrite any recorded object ID assignment information in the back end",
    NO: "No, I don't think I can do it at this time",
    LEARN: "I am not sure, tell me more about synchronization",
};

export const confirmSyncObjectIds = async () => {
    let result = await window.showQuickPick(Object.values(OPTION), {
        placeHolder: "Are you sure you want to synchronize your object ID assignment information with the back end?"
    });
    switch (result) {
        case OPTION.YES:
            commands.executeCommand("vjeko-al-objid.sync-object-ids");
            break;
        case OPTION.LEARN:
            env.openExternal(Uri.parse(URLS.SYNCHRONIZATION_LEARN));
            break;   
    }
};
