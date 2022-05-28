import { DecorationSeverity } from "./DecorationSeverity";

export interface Decoration {
    severity?: DecorationSeverity;
    badge?: string;
    propagate?: boolean;
    tooltip?: string;
}
