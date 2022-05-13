import { ALApp } from "../ALApp";

export interface GitCleanOperationContext {
    apps: ALApp[];
    operation: (manifest: ALApp) => Promise<boolean>;
    getFilesToStage: (manifest: ALApp) => string[];
    learnMore: (manifests: ALApp | ALApp[]) => any;
    getCommitMessage: (manifests: ALApp[]) => string;
}
