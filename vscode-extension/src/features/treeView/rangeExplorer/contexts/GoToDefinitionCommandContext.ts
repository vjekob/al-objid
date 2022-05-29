import { ALApp } from "../../../../lib/ALApp";
import { ALRange } from "../../../../lib/types/ALRange";

export type GoToDefinitionFile = "manifest" | "configuration";
export type GoToDefinitionType =
    | "idRanges"
    | "objectRanges"
    | "range"
    | "logicalName"
    | "objectType"
    | "objectTypeRanges";

export interface GoToDefinitionContext {
    app: ALApp;
    file: GoToDefinitionFile;
    type: GoToDefinitionType;
    range?: ALRange;
    name?: string;
    objectType?: string;
}

export interface GoToDefinitionCommandContext {
    goto: GoToDefinitionContext;
}
