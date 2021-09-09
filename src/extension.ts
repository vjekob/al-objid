import { ExtensionContext, commands, languages } from "vscode";
import { authorizeApp } from "./commands/authorize-app";
import { commitSuggestionCommand } from "./commands/commit-suggestion";
import { deauthorizeApp } from "./commands/deauthorize-app";
import { syncObjectIds } from "./commands/sync-object-ids";
import { getStatusBarDisposables } from "./features/AuthorizationStatusBar";
import { NextObjectIdCompletionProvider } from "./features/NextObjectIdCompletionProvider";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand("vjeko-al-objid.commit-suggestion", commitSuggestionCommand),
		commands.registerCommand("vjeko-al-objid.sync-object-ids", syncObjectIds),
		commands.registerCommand("vjeko-al-objid.authorize-app", authorizeApp),
		commands.registerCommand("vjeko-al-objid.deauthorize-app", deauthorizeApp),
		languages.registerCompletionItemProvider("al", new NextObjectIdCompletionProvider()),
		...getStatusBarDisposables(),
	);
}

export function deactivate() { }
