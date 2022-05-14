import path = require("path");
import { commands, Uri } from "vscode";
import { CodeCommand } from "./commands";

export const learnWelcome = () => {
    let uri = Uri.file(path.join(__dirname, "../../doc/Welcome.md"));
    commands.executeCommand(CodeCommand.MarkdownShowPreview, uri);
};
