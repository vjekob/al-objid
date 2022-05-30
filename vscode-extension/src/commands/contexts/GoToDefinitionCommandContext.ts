import { ALApp } from "../../lib/ALApp";
import { ALRange } from "../../lib/types/ALRange";

export enum GoToDefinitionFile {
    Manifest,
    Configuration,
}

export enum GoToDefinitionType {
    IdRanges,
    ObjectRanges,
    Range,
    LogicalName,
    ObjectType,
    ObjectTypeRanges,
    ObjectTypeRange,
}

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
