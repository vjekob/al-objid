import { commands, ExtensionContext, languages } from "vscode";
import { NewsHandler } from "./features/NewsHandler";
import { AuthorizationStatusBar } from "./features/AuthorizationStatusBar";
import { PollingHandler } from "./features/PollingHandler";
import { NextObjectIdCompletionProvider } from "./features/completion/NextObjectIdCompletionProvider";
import { Output } from "./features/Output";
import { Config } from "./lib/Config";
import { HttpStatusHandler } from "./features/HttpStatusHandler";
import { ReleaseNotesHandler } from "./features/ReleaseNotesHandler";
import { Telemetry } from "./lib/Telemetry";
import { ParserConnector } from "./features/ParserConnector";
import { Diagnostics } from "./features/diagnostics/Diagnostics";
import { ObjIdConfigActionProvider } from "./features/codeActions/ObjIdConfigCodeActionProvider";
import { ConsumptionCache } from "./features/ConsumptionCache";
import { WorkspaceManager } from "./features/WorkspaceManager";
import { CodeCommand, registerCommands } from "./commands/commands";
import { ConsumptionWarnings } from "./features/ConsumptionWarnings";
import { RangeExplorerView } from "./features/treeView/rangeExplorer/RangeExplorerView";
import { AppPoolExplorerView } from "./features/treeView/appPoolExplorer/AppPoolExplorerView";
import { setFlags } from "./flags";
import { ExtensionApi } from "./api/ExtensionApi";
import { ALCodeActionProvider } from "./features/codeActions/ALCodeActionProvider";
import { AssignmentExplorerView } from "./features/treeView/assignmentExplorer/AssignmentExplorerView";

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
        new AssignmentExplorerView("ninja-assignmentExplorer"),

        // CodeActions providers
        languages.registerCodeActionsProvider("jsonc", new ObjIdConfigActionProvider()),
        languages.registerCodeActionsProvider("al", new ALCodeActionProvider()),

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

    // Return public extension API
    return new ExtensionApi();
}

export function deactivate() {
    commands.executeCommand(CodeCommand.SetContext, "vjeko-al-objid.active", false);
}
