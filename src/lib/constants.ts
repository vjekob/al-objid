export const EXTENSION_NAME = "AL Object ID Ninja";

export const URLS = {
    AUTHORIZATION_LEARN: "https://github.com/vjekob/al-objid/tree/master/doc/Authorization.md",
    SYNCHRONIZATION_LEARN: "https://github.com/vjekob/al-objid/tree/master/doc/Synchronization.md",
    EXTENSION_LEARN: "https://github.com/vjekob/al-objid/tree/master/doc/Welcome.md",
    AUTO_SYNC: "https://github.com/vjekob/al-objid/tree/master/doc/AutoSync.md",
    AUTO_SYNC_DIRTY: "https://github.com/vjekob/al-objid/tree/master/doc/AutoSyncDirty.md",
}

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
    "xmlport"
];

export const LABELS = {
    BUTTON_SYNCHRONIZE: "Synchronize",
    BUTTON_LEARN_MORE: "Learn more",
    BUTTON_DONT_ASK: "Stop asking me for this VS Code session",

    SYNC_ARE_YOU_SURE: {
        YES: "Yes, please replace existing object ID consumptions in the back end",
        NO: "No, I have changed my mind"
    },

    AUTO_SYNC_PICK: {
        FULL_AUTO: "Fully automated (no questions)",
        INTERACTIVE: "Interactive (ask about folders and branches)",
        LEARN_MORE: "Learn more about auto-syncing"
    }
};
