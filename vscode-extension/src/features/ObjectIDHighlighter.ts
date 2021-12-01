import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, languages, Position, Range, window } from "vscode";
import { DisposableHolder } from "./DisposableHolder";

/*
The idea here is to provide document diagnostics for IDs that have not been synchronized (unknown to the back end).
Two problems to solve first:
- Parser must provide token positions for IDs (object IDs, field IDs, enum values)
- Back end must provide information about consumed IDs in an inexpensive way
*/


export class ObjectIDHighlighter extends DisposableHolder {
    private static _instance: ObjectIDHighlighter;
    private _diagnostics: DiagnosticCollection;

    private createWarning(start: Position, end: Position, alObject: ALObject) {
        return new Diagnostic(new Range(start, end), `${alObject.type} ${alObject.id} is not synchronized`, DiagnosticSeverity.Warning);
    }

    private constructor() {
        super();
        this._diagnostics = languages.createDiagnosticCollection("al-objid");
        this.registerDisposable(window.onDidChangeActiveTextEditor(this.updateHighlighting, this));
        this.registerDisposable(this._diagnostics);
    }

    public static get instance(): ObjectIDHighlighter {
        return this._instance || (this._instance = new ObjectIDHighlighter());
    }

    public updateHighlighting() {
        this._diagnostics.clear();
        // this._diagnostics.set(window.activeTextEditor?.document.uri!, [this.createWarning()]);
    }

    protected override prepareDisposables() {
        this.updateHighlighting();
    };
}
