import { PropertyBag } from "../../lib/types/PropertyBag";
import { WorkspaceManager } from "../WorkspaceManager";
import { CodeActionProvider, TextDocument, Range, CodeActionContext, CodeAction, CodeActionKind } from "vscode";
import { QuickFixProvider } from "./QuickFixProvider";
import { NinjaDiagnostic } from "../diagnostics/NinjaDiagnostic";

function createAction(command: string, args: any[], title: string) {
    const action = new CodeAction(title);
    action.kind = CodeActionKind.QuickFix;
    action.command = { command, arguments: args, title };
    return action;
}

export abstract class BaseCodeActionProvider implements CodeActionProvider {
    private readonly _actions: PropertyBag<QuickFixProvider>;

    protected constructor(actions: PropertyBag<QuickFixProvider>) {
        this._actions = actions;
    }

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
            let data: any = undefined;
            if (issue instanceof NinjaDiagnostic) {
                data = issue.data;
            }
            let code = issue.code;
            if (typeof issue.code === "object" && typeof issue.code.value === "string") {
                code = issue.code.value;
            }
            if (typeof code !== "string") {
                continue;
            }
            const action = this._actions[code]({ actions, app, document, range, data });
            if (action instanceof Promise) {
                await action;
            }
        }
        return actions;
    }
}
