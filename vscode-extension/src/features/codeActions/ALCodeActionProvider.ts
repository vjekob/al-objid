import { CodeAction, CodeActionKind } from "vscode";
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
    [DIAGNOSTIC_CODE.CONSUMPTION.UNASSIGNED]: ({ actions, app, data, range, document }) => {
        actions.push(
            createAction(NinjaCommand.QuickFixStoreIdAssignment, [app, data, document, range], "Store ID assignment")
        );
    },
};

export class ALCodeActionProvider extends BaseCodeActionProvider {
    public constructor() {
        super(QuickFix);
    }
}
