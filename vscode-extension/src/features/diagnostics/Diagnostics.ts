import { PropertyBag } from "../../lib/types/PropertyBag";
import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, Disposable, languages, Range, Uri } from "vscode";
import { NinjaDiagnostic } from "./NinjaDiagnostic";

export interface CreateDiagnostic {
    (range: Range, message: string, severity?: DiagnosticSeverity, code?: string): NinjaDiagnostic;
}

export const DIAGNOSTIC_CODE = {
    OBJIDCONFIG: {
        INVALID_PROPERTY: "N0101",
        MISSING_PROPERTY: "N0102",
        IDRANGES_INVALID_TYPE: "N0103",
        IDRANGES_INVALID_NUMBER: "N0104",
        IDRANGES_TO_BEFORE_FROM: "N0105",
        IDRANGES_OVERLAP: "N0106",
        INVALID_OBJECT_TYPE: "N0107",
        LICENSE_FILE_NOT_FOUND: "N0108",
        LICENSE_FILE_INVALID: "N0109",
    },

    BCLICENSE: {
        UNAVAILABLE: "N0201",
    },

    CONSUMPTION: {
        UNASSIGNED: "N0301",
    },
};

export const DIAGNOSTIC_URI: PropertyBag<Uri> = {
    [DIAGNOSTIC_CODE.CONSUMPTION.UNASSIGNED]: Uri.parse("https://github.com/vjekob/al-objid/wiki/Ninja-Warning-N0301"),
};

export class Diagnostics implements Disposable {
    //#region Singleton
    private static _instance: Diagnostics;

    private constructor() {
        this._diagnostics = languages.createDiagnosticCollection("al-objid");
    }

    public static get instance(): Diagnostics {
        return this._instance || (this._instance = new Diagnostics());
    }
    //#endregion

    //#region Disposable
    private _disposed: boolean = false;

    public dispose() {
        if (!this._disposed) {
            return;
        }
        this._disposed = true;
        this._diagnostics.dispose();
    }
    //#endregion

    private readonly _diagnostics: DiagnosticCollection;
    private _documents = new WeakMap<Uri, PropertyBag<Diagnostic[]>>();
    private _schedulers = new WeakMap<Uri, NodeJS.Timeout>();

    public resetForUri(uri: Uri) {
        this._diagnostics.delete(uri);
    }

    public createDiagnostics(uri: Uri, category: string): CreateDiagnostic {
        let document = this._documents.get(uri);
        if (!document) {
            document = {};
            this._documents.set(uri, document);
        }
        document[category] = [];

        const newDiagnostics = (document[category] = [] as Diagnostic[]);
        const scheduleUpdate = () => {
            const scheduler = this._schedulers.get(uri);
            if (scheduler) {
                clearTimeout(scheduler);
            }
            this._schedulers.set(
                uri,
                setTimeout(() => {
                    const set: Diagnostic[] = [];
                    for (let key of Object.keys(document!)) {
                        set.push(...document![key]);
                    }
                    this._diagnostics.set(uri, set);
                }, 1000)
            );
        };

        // Makes sure that diagnostics are reported at least once
        scheduleUpdate();

        return (range, message, severity, code) => {
            const diagnostic = new NinjaDiagnostic(
                range,
                `${message.charAt(0).toUpperCase()}${message.slice(1)}`,
                severity
            );
            let diagnosticCode: string | { target: Uri; value: string } | undefined = code;
            if (code && DIAGNOSTIC_URI[code]) {
                diagnosticCode = {
                    value: code,
                    target: DIAGNOSTIC_URI[code],
                };
            }
            diagnostic.source = "Ninja";
            diagnostic.code = diagnosticCode;
            newDiagnostics.push(diagnostic);
            scheduleUpdate();
            return diagnostic;
        };
    }
}
