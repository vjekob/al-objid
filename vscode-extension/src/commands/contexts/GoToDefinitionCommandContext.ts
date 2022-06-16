import { ALApp } from "../../lib/ALApp";
import { ALRange } from "../../lib/types/ALRange";

export enum GoToDefinitionFile {
    Manifest = "manifest",
    Configuration = "configuration",
}

export enum GoToDefinitionType {
    IdRanges = "IdRanges",
    ObjectRanges = "ObjectRanges",
    Range = "Range",
    LogicalName = "LogicalName",
    ObjectType = "ObjectType",
    ObjectTypeRanges = "ObjectTypeRanges",
    ObjectTypeRange = "ObjectTypeRange",
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
