import path = require("path");
import { commands, Uri } from "vscode";

export const learnWelcome = () => {
    let uri = Uri.file(path.join(__dirname, "../../doc/Welcome.md"));
    commands.executeCommand("markdown.showPreview", uri);
};
