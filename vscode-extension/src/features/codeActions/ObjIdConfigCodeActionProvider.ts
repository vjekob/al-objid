import { CodeAction, CodeActionKind } from "vscode";
import { ALObjectType } from "../../lib/types/ALObjectType";
import { getSymbolAtPosition } from "../../lib/functions/getSymbolAtPosition";
import { DIAGNOSTIC_CODE } from "../diagnostics/Diagnostics";
import { NinjaCommand } from "../../commands/commands";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { QuickFixProvider } from "./QuickFixProvider";
import { BaseCodeActionProvider } from "./BaseCodeActionProvider";

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

export class ObjIdConfigActionProvider extends BaseCodeActionProvider {
    public constructor() {
        super(QuickFix);
    }
}
