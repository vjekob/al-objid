import {
    CompletionItem,
    CompletionItemKind,
    Position,
    Range,
    TextEdit,
    Uri,
    WorkspaceEdit,
    window,
    workspace,
} from "vscode";
import { ALApp } from "../../lib/ALApp";
import { NinjaCommand } from "../../commands/commands";
import { ALRanges } from "../../lib/types/ALRange";
import { UI } from "../../lib/UI";
import { Backend } from "../../lib/backend/Backend";
import { commitAssignment, processAssignmentResult, continueWithAssignment } from "./completionFunctions";
import { NinjaALRange } from "../../lib/types/NinjaALRange";

async function getNumber(
    minAllowed: number,
    maxAllowed: number,
    minMax: string,
    value: number
): Promise<number | undefined> {
    const result = await window.showInputBox({
        ignoreFocusOut: false,
        value: value.toString(),
        placeHolder: `${minMax.charAt(0).toUpperCase()}${minMax.slice(1)} object ID`,
        prompt: `Enter the ${minMax} object ID you want to be suggested`,
        validateInput: (value: string) => {
            if (isNaN(Number(value))) {
                return "Please enter a number";
            }
            if (Number(value) < minAllowed) {
                return `You can't assign object IDs lower than ${minAllowed}`;
            }
            if (Number(value) > maxAllowed) {
                return `You can't assign object IDs higher than ${maxAllowed}`;
            }
            return undefined;
        },
    });
    return result === undefined ? undefined : Number(result);
}

async function getMinMax(minAllowed: number, maxAllowed: number): Promise<[number, number] | undefined> {
    const min = await getNumber(minAllowed, maxAllowed, "minimum", minAllowed);
    if (!min) {
        return undefined;
    }
    const max = (await getNumber(min, maxAllowed, "maximum", maxAllowed)) || maxAllowed;
    return [Number(min), Number(max)];
}

export class InteractiveCompletionItem extends CompletionItem {
    constructor(type: string, app: ALApp, position: Position, uri: Uri, range?: NinjaALRange) {
        super("Interactive...", CompletionItemKind.Property);
        this.sortText = "!#.Interactive";
        this.detail = "AL Object ID Ninja";
        this.documentation = `Allows you to choose the next object ID interactively.\n\nYou can manually specify the range from which you would prefer your next object ID to be assigned. Ninja will automatically assign the next available object ID in the specified range.`;
        this.insertText = "";

        this.command = {
            command: NinjaCommand.CommitSuggestion,
            title: "",
            arguments: [
                async () => {
                    const minAllowed = app.manifest.idRanges.reduce((prev, curr) => {
                        return prev.from < curr.from ? prev : curr;
                    }).from;
                    const maxAllowed = app.manifest.idRanges.reduce((prev, curr) => {
                        return prev.to > curr.to ? prev : curr;
                    }).to;

                    let result = "";
                    const minMax = await getMinMax(minAllowed, maxAllowed);
                    if (minMax) {
                        const [from, to] = minMax;
                        const intersection: ALRanges = [];
                        const sourceRanges =
                            app.config.objectRanges[type] ||
                            (app.config.idRanges.length && app.config.idRanges) ||
                            app.manifest.idRanges;
                        for (let range of sourceRanges) {
                            if (range.from >= from && range.to <= to) {
                                intersection.push(range);
                                continue;
                            }
                            if (range.from <= from && range.to >= to) {
                                intersection.push({ from, to });
                                continue;
                            }
                            if (range.from <= from && range.to >= from) {
                                intersection.push({ from, to: range.to });
                                continue;
                            }
                            if (range.from <= to && range.to >= to) {
                                intersection.push({ from: range.from, to });
                            }
                        }
                        if (intersection.length) {
                            intersection.mandatory = true;
                            const objId = await Backend.getNextNo(app, type, intersection, true);
                            if (continueWithAssignment(app, objId)) {
                                processAssignmentResult(position, uri, app, objId!, range, 0);
                                return;
                            }
                        } else {
                            UI.assignment.showInteractiveNoOverlapError(app, type);
                        }
                    }

                    let replace = new WorkspaceEdit();
                    replace.set(uri, [
                        TextEdit.replace(
                            new Range(position, position.translate(0, (this.insertText as string)!.length)),
                            result || ""
                        ),
                    ]);
                    workspace.applyEdit(replace);
                },
            ],
        };
    }
}
