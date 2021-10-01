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
import { BackEndLogHandler } from "./features/BackEndLogHandler";
import { NextObjectIdCompletionProvider } from "./features/NextObjectIdCompletionProvider";
import { ObjectIDHighlighter } from "./features/ObjectIDHighlighter";
import { Output } from "./features/Output";
import { Config } from "./lib/Config";
import { HttpGone } from "./features/HttpGone";
import { ReleaseNotesHandler } from "./features/ReleaseNotesHandler";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		// Commands
		commands.registerCommand("vjeko-al-objid.confirm-sync-object-ids", confirmSyncObjectIds),
		commands.registerCommand("vjeko-al-objid.confirm-authorize-app", confirmAuthorizeApp),
		commands.registerCommand("vjeko-al-objid.confirm-deauthorize-app", confirmDeauthorizeApp),
		commands.registerCommand("vjeko-al-objid.auto-sync-object-ids", autoSyncObjectIds),

		// Internal commands
		commands.registerCommand("vjeko-al-objid.commit-suggestion", commitSuggestionCommand),
		commands.registerCommand("vjeko-al-objid.sync-object-ids", syncObjectIds),
		commands.registerCommand("vjeko-al-objid.authorize-app", authorizeApp),
		commands.registerCommand("vjeko-al-objid.deauthorize-app", deauthorizeApp),
		commands.registerCommand("vjeko-al-objid.learn-welcome", learnWelcome),

		// Other
		languages.registerCompletionItemProvider("al", new NextObjectIdCompletionProvider()),
		AuthorizationStatusBar.instance.getDisposables(),
		Output.instance.getDisposables(),
		Config.instance.getDisposables(),
		Disposable.from(new BackEndLogHandler()),
		Disposable.from(new NewsHandler(context)),
		new HttpGone(context).getDisposables(),
	);

	new ReleaseNotesHandler().check(context);
}

export function deactivate() { }
