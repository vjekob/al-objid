import { Uri } from "vscode";
import { NinjaIcon } from "../../lib/NinjaIcon";

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

export const ObjectSeverityIcons: { [key: number]: { dark: string | Uri; light: string | Uri } | undefined } = {
    [DecorationSeverity.none]: NinjaIcon["object-green"],
    [DecorationSeverity.inactive]: undefined,
    [DecorationSeverity.info]: NinjaIcon["object-blue"],
    [DecorationSeverity.warning]: NinjaIcon["object-yellow"],
    [DecorationSeverity.error]: NinjaIcon["object-red"],
};

export const RangeSeverityIcons: { [key: number]: { dark: string | Uri; light: string | Uri } | undefined } = {
    [DecorationSeverity.none]: NinjaIcon["range-green"],
    [DecorationSeverity.inactive]: undefined,
    [DecorationSeverity.info]: NinjaIcon["range-blue"],
    [DecorationSeverity.warning]: NinjaIcon["range-yellow"],
    [DecorationSeverity.error]: NinjaIcon["range-red"],
};

export function getSeverityFromRemaining(remaining: number, size: number): DecorationSeverity {
    let severity = DecorationSeverity.none;
    if (remaining < 100) {
        if (remaining <= Math.max(size * 0.45, 10)) {
            severity = DecorationSeverity.info;
            if (remaining <= Math.max(size * 0.15, 5)) {
                severity = DecorationSeverity.warning;
                if (remaining === 0) {
                    severity = DecorationSeverity.error;
                }
            }
        }
    }
    return severity;
}
