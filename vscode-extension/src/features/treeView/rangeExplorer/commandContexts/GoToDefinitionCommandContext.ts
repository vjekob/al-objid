import { ALApp } from "../../../../lib/ALApp";
import { ALRange } from "../../../../lib/types/ALRange";

export type GoToDefinitionFile = "manifest" | "configuration";
export type GoToDefinitionType = "idRanges" | "objectRanges" | "range" | "objectType" | "objectTypeRanges";

export interface GoToDefinitionContext {
    app: ALApp;
    file: GoToDefinitionFile;
    type: GoToDefinitionType;
    range?: ALRange;
}

export interface GoToDefinitionCommandContext {
    goto: GoToDefinitionContext;
}
