import {
    Command,
    CompletionItem,
    CompletionItemKind,
    MarkdownString,
    Position,
    Uri,
} from "vscode";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { NextObjectIdInfo } from "../../lib/types/NextObjectIdInfo";
import { NextIdContext } from "../ParserConnector";
import { ALApp } from "../../lib/ALApp";
import { NinjaCommand } from "../../commands/commands";
import { commitAssignment } from "./completionFunctions";

export type CommitNextObjectId = (app: ALApp) => Promise<NextObjectIdInfo>;

export class NextObjectIdCompletionItem extends CompletionItem {
    private _injectSemicolon: boolean = false;
    private _range: NinjaALRange | undefined;

    constructor(
        type: string,
        objectId: NextObjectIdInfo,
        app: ALApp,
        position: Position,
        uri: Uri,
        nextIdContext: NextIdContext,
        range?: NinjaALRange
    ) {
        super(`${objectId.id}${nextIdContext.injectSemicolon ? ";" : ""}`, CompletionItemKind.Constant);

        this._injectSemicolon = nextIdContext.injectSemicolon;
        this._range = range;

        this.sortText = nextIdContext.additional ? `!!.${nextIdContext.additional.ordinal / 1000}` : "0";
        this.command = this.getCompletionCommand(position, uri, type, app, objectId);
        this.documentation = this.getCompletionDocumentation(type, objectId);
        this.insertText = `${objectId.id}${this._injectSemicolon ? ";" : ""}`;
        this.detail = "AL Object ID Ninja";
        this.label = range && range.description ? `${objectId.id} (${range.description})` : this.insertText;
    }

    getCompletionCommand(position: Position, uri: Uri, type: string, app: ALApp, objectId: NextObjectIdInfo): Command {
        return {
            command: NinjaCommand.CommitSuggestion,
            title: "",
            arguments: [() => commitAssignment(position, uri, type, app, objectId, this._range)],
        };
    }

    private nextIdDescription(type: string): string {
        const parts = type.split("_");

        if (parts.length === 1) {
            return type;
        }

        let id = "";
        switch (parts[0]) {
            case "table":
                id = "field ID";
                break;
            case "enum":
                id = "value ID";
                break;
        }

        return `${id} from ${parts[0]} ${parts[1]}`;
    }

    getCompletionDocumentation(type: string, objectId: NextObjectIdInfo): MarkdownString {
        const firstLine = `Assigns the next available ${this.nextIdDescription(type)} from the Azure back end.`;
        let typeDesc = `${type} ${objectId.id}`;
        if (type.startsWith("table_")) {
            typeDesc = `field(${objectId.id}; ...)`;
        } else if (type.startsWith("enum_")) {
            typeDesc = `value(${objectId.id}; ...)`;
        }

        const message = new MarkdownString(firstLine);
        message.appendCodeblock(typeDesc, "al");
        if (!objectId.hasConsumption) {
            message.appendMarkdown(
                "**Important:** The back end has no object ID consumption information. Please, run `Ninja: Synchronize object IDs with the Azure back end` command before accepting this object ID."
            );
            return message;
        }
        message.appendMarkdown(
            "This number is **temporary**. The actual number will be assigned when you select this auto-complete entry."
        );

        return message;
    }
}
