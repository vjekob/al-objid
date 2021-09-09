import { ExtensionContext, commands, languages } from "vscode";
import { authorizeApp } from "./commands/authorize-app";
import { commitSuggestionCommand } from "./commands/commit-suggestion";
import { confirmAuthorizeApp } from "./commands/confirm-authorize-app";
import { confirmDeauthorizeApp } from "./commands/confirm-deauthorize-app";
import { deauthorizeApp } from "./commands/deauthorize-app";
import { syncObjectIds } from "./commands/sync-object-ids";
import { AuthorizationStatusBar } from "./features/AuthorizationStatusBar";
import { NextObjectIdCompletionProvider } from "./features/NextObjectIdCompletionProvider";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		// Commands
		commands.registerCommand("vjeko-al-objid.sync-object-ids", syncObjectIds),
		commands.registerCommand("vjeko-al-objid.confirm-authorize-app", confirmAuthorizeApp),
		commands.registerCommand("vjeko-al-objid.confirm-deauthorize-app", confirmDeauthorizeApp),

		// Internal commands
		commands.registerCommand("vjeko-al-objid.commit-suggestion", commitSuggestionCommand),
		commands.registerCommand("vjeko-al-objid.authorize-app", authorizeApp),
		commands.registerCommand("vjeko-al-objid.deauthorize-app", deauthorizeApp),

		// Other
		languages.registerCompletionItemProvider("al", new NextObjectIdCompletionProvider()),
		...AuthorizationStatusBar.instance.getStatusBarDisposables(),
	);
}

export function deactivate() { }
