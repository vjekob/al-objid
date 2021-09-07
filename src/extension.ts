import { ExtensionContext, commands, languages } from "vscode";
import { commitSuggestionCommand } from "./commands/commit-suggestion";
import { syncObjectIds } from "./commands/sync-object-ids";
import { NextObjectIdCompletionProvider } from "./providers/NextObjectIdCompletionProvider";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand("vjeko-al-objid.commit-suggestion", commitSuggestionCommand),
		commands.registerCommand("vjeko-al-objid.sync-object-ids", syncObjectIds),
		languages.registerCompletionItemProvider("al", new NextObjectIdCompletionProvider()),
	);
}

export function deactivate() { }
