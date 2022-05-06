import { extensions } from "vscode";

export const EXTENSION_NAME = "AL Object ID Ninja";
export const EXTENSION_VERSION =
    extensions.getExtension("vjeko.vjeko-al-objid")?.packageJSON?.version;

export const URLS = {
    AUTHORIZATION_LEARN: "https://github.com/vjekob/al-objid/tree/master/doc/Authorization.md",
    SYNCHRONIZATION_LEARN: "https://github.com/vjekob/al-objid/tree/master/doc/Synchronization.md",
    EXTENSION_LEARN: "https://github.com/vjekob/al-objid/tree/master/doc/Welcome.md",
    AUTO_SYNC: "https://github.com/vjekob/al-objid/tree/master/doc/AutoSync.md",
    AUTO_SYNC_DIRTY: "https://github.com/vjekob/al-objid/tree/master/doc/AutoSyncDirty.md",
};

export const OBJECT_TYPES = [
    "codeunit",
    "enum",
    "enumextension",
    "page",
    "pageextension",
    "permissionset",
    "permissionsetextension",
    "query",
    "report",
    "reportextension",
    "table",
    "tableextension",
    "xmlport",
];

// TODO replace the array above with the enum below (and make sure to break nothing in the proces)
export enum ALObjectType {
    codeunit = "codeunit",
    enum = "enum",
    enumextension = "enumextension",
    page = "page",
    pageextension = "pageextension",
    permissionset = "permissionset",
    permissionsetextension = "permissionsetextension",
    query = "query",
    report = "report",
    reportextension = "reportextension",
    table = "table",
    tableextension = "tableextension",
    xmlport = "xmlport",
}

export const LABELS = {
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
    APP_POOLS: "app-pools",
};
