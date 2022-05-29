import { ALApp } from "../../lib/ALApp";
import { ALRange } from "../../lib/types/ALRange";

export type GoToDefinitionFile = "manifest" | "configuration";
export type GoToDefinitionType =
    | "idRanges"
    | "objectRanges"
    | "range"
    | "logicalName"
    | "objectType"
    | "objectTypeRanges"
    | "objectTypeRange";

export interface GoToDefinitionContext<T extends ALRange> {
    app: ALApp;
    file: GoToDefinitionFile;
    type: GoToDefinitionType;
    range?: T;
    logicalName?: string;
    objectType?: string;
}

export interface GoToDefinitionCommandContext<T extends ALRange> {
    goto: GoToDefinitionContext<T>;
}
