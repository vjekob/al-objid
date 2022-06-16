import { commands, ExtensionContext, languages } from "vscode";
import { NewsHandler } from "./features/NewsHandler";
import { AuthorizationStatusBar } from "./features/AuthorizationStatusBar";
import { PollingHandler } from "./features/PollingHandler";
import { NextObjectIdCompletionProvider } from "./features/NextObjectIdCompletionProvider";
import { Output } from "./features/Output";
import { Config } from "./lib/Config";
import { HttpStatusHandler } from "./features/HttpStatusHandler";
import { ReleaseNotesHandler } from "./features/ReleaseNotesHandler";
import { Telemetry } from "./lib/Telemetry";
import { ParserConnector } from "./features/ParserConnector";
import { Diagnostics } from "./features/Diagnostics";
import { ObjIdConfigActionProvider } from "./features/ObjIdConfigCodeActionProvider";
import { ConsumptionCache } from "./features/ConsumptionCache";
import { WorkspaceManager } from "./features/WorkspaceManager";
import { CodeCommand, registerCommands } from "./commands/commands";
import { ConsumptionWarnings } from "./features/ConsumptionWarnings";
import { RangeExplorerView } from "./features/treeView/rangeExplorer/RangeExplorerView";
import { AppPoolExplorerView } from "./features/treeView/appPoolExplorer/AppPoolExplorerView";
import { setFlags } from "./flags";

export function activate(context: ExtensionContext) {
    setFlags();
    commands.executeCommand(CodeCommand.SetContext, "vjeko-al-objid.active", true);
    ConsumptionWarnings.instance.setContext(context);
    Telemetry.instance.setContext(context);

    context.subscriptions.push(
        ...registerCommands(),

        // Tree views
        new RangeExplorerView("ninja-rangeExplorer"),
        new AppPoolExplorerView("ninja-appPoolExplorer"),

        // CodeActions provider
        languages.registerCodeActionsProvider("jsonc", new ObjIdConfigActionProvider()),

        // Other VS Code features
        languages.registerCompletionItemProvider("al", new NextObjectIdCompletionProvider()),

        // Other Ninja features
        WorkspaceManager.instance,
        AuthorizationStatusBar.instance.getDisposables(),
        Output.instance.getDisposables(),
        Config.instance.getDisposables(),
        new PollingHandler(),
        new NewsHandler(context),
        new HttpStatusHandler(context).getDisposables(),
        ParserConnector.instance,
        Diagnostics.instance,
        ConsumptionCache.instance
    );

    ReleaseNotesHandler.instance.check(context);
}

export function deactivate() {
    commands.executeCommand(CodeCommand.SetContext, "vjeko-al-objid.active", false);
}
