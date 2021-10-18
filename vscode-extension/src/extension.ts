import { ExtensionContext, commands, languages, Disposable, window } from "vscode";
import { authorizeApp } from "./commands/authorize-app";
import { autoSyncObjectIds } from "./commands/auto-sync-object-ids";
import { commitSuggestionCommand } from "./commands/commit-suggestion";
import { confirmAuthorizeApp } from "./commands/confirm-authorize-app";
import { confirmDeauthorizeApp } from "./commands/confirm-deauthorize-app";
import { confirmSyncObjectIds } from "./commands/confirm-sync-object-ids";
import { deauthorizeApp } from "./commands/deauthorize-app";
import { learnWelcome } from "./commands/learn-welcome";
import { syncObjectIds } from "./commands/sync-object-ids";
import { NewsHandler } from "./features/NewsHandler";
import { AuthorizationStatusBar } from "./features/AuthorizationStatusBar";
import { PollingHandler } from "./features/PollingHandler";
import { NextObjectIdCompletionProvider } from "./features/NextObjectIdCompletionProvider";
import { ObjectIDHighlighter } from "./features/ObjectIDHighlighter";
import { Output } from "./features/Output";
import { Config } from "./lib/Config";
import { HttpStatusHandler } from "./features/HttpStatusHandler";
import { ReleaseNotesHandler } from "./features/ReleaseNotesHandler";
import { showReleaseNotes } from "./commands/show-release-notes";
import { ExplorerTreeDataProvider } from "./features/Explorer/ExplorerTreeDataProvider";
import { ExplorerDecorationsProvider } from "./features/Explorer/ExplorerDecorationsProvider";
import { ConsumptionWarnings } from "./features/ConsumptionWarnings";
import { Telemetry } from "./lib/Telemetry";

export function activate(context: ExtensionContext) {
	ConsumptionWarnings.instance.setContext(context);
	Telemetry.instance.setContext(context);

	context.subscriptions.push(
		// Commands
		commands.registerCommand("vjeko-al-objid.confirm-sync-object-ids", confirmSyncObjectIds),
		commands.registerCommand("vjeko-al-objid.confirm-authorize-app", confirmAuthorizeApp),
		commands.registerCommand("vjeko-al-objid.confirm-deauthorize-app", confirmDeauthorizeApp),
		commands.registerCommand("vjeko-al-objid.auto-sync-object-ids", autoSyncObjectIds),
		commands.registerCommand("vjeko-al-objid.show-release-notes", showReleaseNotes),

		// Internal commands
		commands.registerCommand("vjeko-al-objid.commit-suggestion", commitSuggestionCommand),
		commands.registerCommand("vjeko-al-objid.sync-object-ids", syncObjectIds),
		commands.registerCommand("vjeko-al-objid.authorize-app", authorizeApp),
		commands.registerCommand("vjeko-al-objid.deauthorize-app", deauthorizeApp),
		commands.registerCommand("vjeko-al-objid.learn-welcome", learnWelcome),

		// Tree view
		ExplorerTreeDataProvider.instance,
		window.registerTreeDataProvider("ninja-rangeExplorer", ExplorerTreeDataProvider.instance),
		window.registerFileDecorationProvider(ExplorerDecorationsProvider.instance),

		// Other
		languages.registerCompletionItemProvider("al", new NextObjectIdCompletionProvider()),
		AuthorizationStatusBar.instance.getDisposables(),
		Output.instance.getDisposables(),
		Config.instance.getDisposables(),
		Disposable.from(new PollingHandler()),
		Disposable.from(new NewsHandler(context)),
		new HttpStatusHandler(context).getDisposables(),
	);

	ReleaseNotesHandler.instance.check(context);
}

export function deactivate() { }
