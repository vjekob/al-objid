import * as path from "path";
import { commands, Uri } from "vscode";

export function showDocument(document: string) {
    commands.executeCommand("markdown.showPreview", Uri.file(path.join(__dirname, `../../docs/${document}.md`)));
}
