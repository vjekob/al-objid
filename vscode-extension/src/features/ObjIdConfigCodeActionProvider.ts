import { CodeActionProvider, TextDocument, Range, CodeActionContext, CancellationToken, CodeAction, DocumentSymbol, commands, SymbolKind, CodeActionKind } from "vscode";
import { getManifest } from "../lib/AppManifest";
import { getSymbolAtPosition } from "../lib/functions";
import { DIAGNOSTIC_CODE } from "./Diagnostics";

export class ObjIdConfigActionProvider implements CodeActionProvider {
    async provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext, token: CancellationToken): Promise<CodeAction[] | undefined> {
        const ninjaIssues = context.diagnostics.filter(diagnostic => typeof diagnostic.code === "string" && diagnostic.code.startsWith("NINJA"));
        if (ninjaIssues.length === 0) {
            return;
        }

        const manifest = getManifest(document.uri);

        const actions: CodeAction[] = [];
        for (let issue of ninjaIssues) {
            switch (issue.code) {
                case DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_OBJECT_TYPE:
                    const symbol = await getSymbolAtPosition(document.uri, range.start)!;
                    createAction(actions, "vjeko-al-objid.quickfix-remove-declaration", [manifest, symbol?.name], "Remove declaration", CodeActionKind.QuickFix);
                    createAction(actions, "", [], "Select valid object type", CodeActionKind.QuickFix);

                    break;

                case DIAGNOSTIC_CODE.OBJIDCONFIG.LICENSE_FILE_NOT_FOUND:
                    createAction(actions, "vjeko-al-objid.select-bclicense", [manifest], "Select a BC license file");
                    break;
            }
        }
        return actions;
    }
}

function createAction(actions: CodeAction[], command: string, args: any[], title: string, kind: CodeActionKind = CodeActionKind.QuickFix) {
    const action = new CodeAction(title);
    action.kind = kind;
    action.command = { command, arguments: args, title };
    actions.push(action);
}