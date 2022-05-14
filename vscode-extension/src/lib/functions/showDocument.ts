import * as path from "path";
import { commands, Uri } from "vscode";
import { CodeCommand } from "../../commands/commands";

export function showDocument(document: string) {
    commands.executeCommand(
        CodeCommand.MarkdownShowPreview,
        Uri.file(path.join(__dirname, `../../docs/${document}.md`))
    );
}
