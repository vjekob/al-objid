import { ExtensionContext, languages } from "vscode";
import { NewsHandler } from "./features/NewsHandler";
import { AuthorizationStatusBar } from "./features/AuthorizationStatusBar";
import { PollingHandler } from "./features/PollingHandler";
import { NextObjectIdCompletionProvider } from "./features/NextObjectIdCompletionProvider";
import { Output } from "./features/Output";
import { Config } from "./lib/Config";
import { HttpStatusHandler } from "./features/HttpStatusHandler";
import { ReleaseNotesHandler } from "./features/ReleaseNotesHandler";
import { ConsumptionWarnings } from "./features/ConsumptionWarnings";
import { Telemetry } from "./lib/Telemetry";
import { ParserConnector } from "./features/ParserConnector";
import { Diagnostics } from "./features/Diagnostics";
import { ObjIdConfigActionProvider } from "./features/ObjIdConfigCodeActionProvider";
import { ConsumptionCache } from "./features/ConsumptionCache";
import { WorkspaceManager } from "./features/WorkspaceManager";
import { registerCommands } from "./commands/commands";
import { RangeExplorerView } from "./features/RangeExplorer/RangeExplorerView";

export function activate(context: ExtensionContext) {
    ConsumptionWarnings.instance.setContext(context);
    Telemetry.instance.setContext(context);

    const rangeExplorer = new RangeExplorerView("ninja-rangeExplorer");

    context.subscriptions.push(
        ...registerCommands(),

        // Tree views
        rangeExplorer,
        // __obsolete_TreeViews_.instance.registerView("ninja-rangeExplorer", rangeExplorer),

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

export function deactivate() {}
