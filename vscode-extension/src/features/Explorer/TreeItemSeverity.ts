export enum TreeItemSeverity {
    none = 0,
    info = 1,
    warning = 2,
    error = 3,
}

export const SeverityColors: any = {
    undefined: "foreground",
    [`${TreeItemSeverity.none}`]: "foreground",
    [`${TreeItemSeverity.info}`]: "editorInfo.foreground",
    [`${TreeItemSeverity.warning}`]: "list.warningForeground",
    [`${TreeItemSeverity.error}`]: "list.errorForeground",
};
