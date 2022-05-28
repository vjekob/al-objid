import { TreeItemSeverity } from "./TreeItemSeverity";

// TODO Move this stuff to a differently-named file (Decoration, NodeDecoration, etc.)

export interface TreeItemDecoration {
    severity?: TreeItemSeverity;
    badge?: string;
    propagate?: boolean;
}

export const severityIconMap: { [key: number]: string | undefined } = {
    [TreeItemSeverity.none]: undefined,
    [TreeItemSeverity.info]: "info",
    [TreeItemSeverity.warning]: "warning",
    [TreeItemSeverity.error]: "error",
};

export function getSeverityFromRemaining(remaining: number): TreeItemSeverity {
    let severity = TreeItemSeverity.none;
    if (remaining <= 10) {
        severity = TreeItemSeverity.info;
        if (remaining <= 5) {
            severity = TreeItemSeverity.warning;
            if (remaining === 0) {
                severity = TreeItemSeverity.error;
            }
        }
    }
    return severity;
}
