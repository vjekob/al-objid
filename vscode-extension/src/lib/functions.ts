import path = require("path");
import { commands, Uri } from "vscode";
import { ALRange } from "./types";

export function showDocument(document: string) {
    commands.executeCommand("markdown.showPreview", Uri.file(path.join(__dirname, `../../docs/${document}.md`)));
}

export function getRangeForId<T extends ALRange>(id: number, ranges: T[]): T | undefined {
    for (let range of ranges) {
        if (id >= range.from && id <= range.to) {
            return range;
        }
    }
}
