import { WorkspaceManager } from "./WorkspaceManager";
import { CodeActionProvider, TextDocument, Range, CodeActionContext, CodeAction, CodeActionKind, Uri } from "vscode";
import { ALObjectType } from "../lib/types/ALObjectType";
import { getSymbolAtPosition } from "../lib/functions/getSymbolAtPosition";
import { DIAGNOSTIC_CODE } from "./Diagnostics";
import { NinjaCommand } from "../commands/commands";
import { ALApp } from "../lib/ALApp";
import { PropertyBag } from "../lib/types/PropertyBag";

interface QuickFixContext {
    actions: CodeAction[];
    app: ALApp;
    document: TextDocument;
    range: Range;
}

interface QuickFixProvider {
    (context: QuickFixContext): void | Promise<void>;
}

function createAction(command: string, args: any[], title: string) {
    const action = new CodeAction(title);
    action.kind = CodeActionKind.QuickFix;
    action.command = { command, arguments: args, title };
    return action;
}

const QuickFix: PropertyBag<QuickFixProvider> = {
    [DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_OBJECT_TYPE]: async ({ actions, app, document, range }) => {
        const symbol = (await getSymbolAtPosition(document.uri, range.start))!;
        actions.push(createAction(NinjaCommand.QuickFixRemoveDeclaration, [app, symbol.name], "Remove declaration"));

        const existingTypes = app.config.objectTypesSpecified;
        const remainingTypes = Object.values<string>(ALObjectType).filter(type => !existingTypes.includes(type));
        if (remainingTypes.length > 0) {
            actions.push(
                createAction(
                    NinjaCommand.QuickFixSelectValidType,
                    [document, symbol.selectionRange, remainingTypes],
                    "Select valid object type"
                )
            );
        }
    },

    [DIAGNOSTIC_CODE.OBJIDCONFIG.INVALID_PROPERTY]: async ({ actions, app, document, range }) => {
        const symbol = (await getSymbolAtPosition(document.uri, range.start))!;
        actions.push(createAction(NinjaCommand.QuickFixRemoveProperty, [app, symbol.name], "Remove property"));
    },

    [DIAGNOSTIC_CODE.OBJIDCONFIG.LICENSE_FILE_NOT_FOUND]: ({ actions, app }) => {
        actions.push(createAction(NinjaCommand.SelectBCLicense, [app], "Select a BC license file"));
    },

    [DIAGNOSTIC_CODE.OBJIDCONFIG.LICENSE_FILE_INVALID]: ({ actions, app }) => {
        actions.push(createAction(NinjaCommand.SelectBCLicense, [app], "Select a BC license file"));
    },
};

export class ObjIdConfigActionProvider implements CodeActionProvider {
    public async provideCodeActions(
        document: TextDocument,
        range: Range,
        context: CodeActionContext
    ): Promise<CodeAction[] | undefined> {
        const ninjaIssues = context.diagnostics.filter(diagnostic => diagnostic.source === "Ninja");
        if (ninjaIssues.length === 0) {
            return;
        }

        const app = WorkspaceManager.instance.getALAppFromUri(document.uri);
        if (!app) {
            return;
        }

        const actions: CodeAction[] = [];
        for (let issue of ninjaIssues) {
            const action = QuickFix[issue.code as string]({ actions, app, document, range });
            if (action instanceof Promise) {
                await action;
            }
        }
        return actions;
    }
}
