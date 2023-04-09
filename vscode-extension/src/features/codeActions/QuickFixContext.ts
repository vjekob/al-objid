import { TextDocument, Range, CodeAction } from "vscode";
import { ALApp } from "../../lib/ALApp";

export interface QuickFixContext {
    actions: CodeAction[];
    app: ALApp;
    document: TextDocument;
    range: Range;
    data?: any;
}
