import { extensions } from "vscode";

export const EXTENSION_NAME = "AL Object ID Ninja";
export const EXTENSION_VERSION = extensions.getExtension("vjeko.vjeko-al-objid")?.packageJSON?.version;

export const APP_FILE_NAME = "app.json";
export const CONFIG_FILE_NAME = ".objidconfig";
export const GIT_HEAD = ".git/HEAD";
export const NINJA_URI_SCHEME = "ninja";

export const URLS = {
    AUTHORIZATION_LEARN: "https://github.com/vjekob/al-objid/tree/master/doc/Authorization.md",
    SYNCHRONIZATION_LEARN: "https://github.com/vjekob/al-objid/tree/master/doc/Synchronization.md",
    EXTENSION_LEARN: "https://github.com/vjekob/al-objid/tree/master/doc/Welcome.md",
    AUTO_SYNC: "https://github.com/vjekob/al-objid/tree/master/doc/AutoSync.md",
    AUTO_SYNC_DIRTY: "https://github.com/vjekob/al-objid/tree/master/doc/AutoSyncDirty.md",
};

export const LABELS = {
    BUTTON_INITIAL_YES: "Yes, please",
    BUTTON_INITIAL_NO: "No, thanks",
    BUTTON_SYNCHRONIZE: "Synchronize",
    BUTTON_LEARN_MORE: "Learn more",
    BUTTON_DONT_ASK: "Stop asking me for this VS Code session",
    BUTTON_SHOW_RELEASE_NOTES: "What's New?",
    BUTTON_DONT_SHOW_AGAIN: "Don't show again",

    SYNC_ARE_YOU_SURE: {
        YES: "Yes, please replace existing object ID consumptions in the back end",
        NO: "No, I have changed my mind",
    },

    AUTO_SYNC_PICK: {
        FULL_AUTO: "Fully automated (no questions)",
        INTERACTIVE: "Interactive (ask about folders and branches)",
        LEARN_MORE: "Learn more about auto-syncing",
    },

    COPY_RANGES_ARE_YOU_SURE: {
        YES: "Yes, overwrite existing logical ranges",
        NO: "No, I have changed my mind",
        LEARN_MORE: "Learn more about logical ranges",
    },

    FIX: "Fix it",
};

/**
 * Indicates that AL Object Ninja has previously been run on this machine. This is needed to
 * decide whether to show release notes.
 */
export const ALREADY_USED = "already_used";

export const TIME = {
    TWO_MINUTES: 2 * 60 * 1000,
    FIVE_MINUTES: 5 * 60 * 1000,
    TEN_MINUTES: 10 * 60 * 1000,
};

export const DOCUMENTS = {
    LOGICAL_RANGES: "logical-ranges",
    AUTHORIZATION_GIT: "authorization-git",
    AUTHORIZED: "authorized",
    AUTHORIZATION_BRANCH_CHANGE: "authorization-branch-change",
    AUTHORIZATION_DELETED: "authorization-deleted",
    AUTHORIZATION_MODIFIED: "authorization-modified",
    APP_ID_CHANGE: "authorization-app-id-change",
    APP_POOLS: "app-pools",
};

export const TELEMETRY_HOST_NAME = "alninja-telemetry.azurewebsites.net";

export const API_RESULT = {
    NOT_SENT: Symbol("NOT_SENT"),
    SUCCESS: Symbol("SUCCESS"),
    ERROR_HANDLED: Symbol("ERROR_HANDLED"),
    ERROR_NOT_HANDLED: Symbol("ERROR_NOT_HANDLED"),
};
