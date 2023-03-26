import { commands } from "vscode";
import { CodeCommand } from "./commands/commands";

let flagsSet = false;

enum FeatureFlags {
    ManagedPools = "managedPools",
}

export const featureFlags: { readonly [key in FeatureFlags]: boolean } = {
    managedPools: false,
};

export function setFlags() {
    if (flagsSet) {
        return;
    }

    for (let key of Object.keys(featureFlags)) {
        const context = `vjeko-al-objid.feature.${key}`;
        commands.executeCommand(CodeCommand.SetContext, context, featureFlags[key as FeatureFlags]);
    }
    flagsSet = true;
}
