import { Uri } from "vscode";
import { ALApp } from "./ALApp";

export interface ALRange {
    from: number;
    to: number;
}

export interface NinjaALRange extends ALRange {
    description: string;
}

export interface GitCleanOperationContext {
    apps: ALApp[];
    operation: (manifest: ALApp) => Promise<boolean>;
    getFilesToStage: (manifest: ALApp) => string[];
    learnMore: (manifests: ALApp | ALApp[]) => any;
    getCommitMessage: (manifests: ALApp[]) => string;
}

export interface GitTopLevelPathContext {
    uri: Uri;
    apps: ALApp[];
    branch: string;
}

export interface BackEndAppInfo {
    hash: string;
    encrypt: (value: string) => string | undefined;
    decrypt: (value: string) => string | undefined;
}
