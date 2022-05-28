export enum DecorationSeverity {
    none = 0,
    inactive = 1,
    info = 2,
    warning = 3,
    error = 4,
}

export const SeverityColors: any = {
    [`${DecorationSeverity.none}`]: "foreground",
    [`${DecorationSeverity.inactive}`]: "list.deemphasizedForeground",
    [`${DecorationSeverity.info}`]: "editorInfo.foreground",
    [`${DecorationSeverity.warning}`]: "list.warningForeground",
    [`${DecorationSeverity.error}`]: "list.errorForeground",
};

export const SeverityIcons: { [key: number]: string | undefined } = {
    [DecorationSeverity.none]: undefined,
    [DecorationSeverity.inactive]: undefined,
    [DecorationSeverity.info]: "info",
    [DecorationSeverity.warning]: "warning",
    [DecorationSeverity.error]: "error",
};

export function getSeverityFromRemaining(remaining: number): DecorationSeverity {
    let severity = DecorationSeverity.none;
    if (remaining <= 10) {
        severity = DecorationSeverity.info;
        if (remaining <= 5) {
            severity = DecorationSeverity.warning;
            if (remaining === 0) {
                severity = DecorationSeverity.error;
            }
        }
    }
    return severity;
}
