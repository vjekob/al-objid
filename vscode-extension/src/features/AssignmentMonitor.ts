import { Diagnostics, DIAGNOSTIC_CODE } from "./diagnostics/Diagnostics";
import { DiagnosticSeverity, Disposable, FileSystemWatcher, Position, Range, Uri, workspace } from "vscode";
import { getObjectDefinitions, getWorkspaceFolderFiles } from "../lib/ObjectIds";
import { LogLevel, output } from "./Output";
import { ALObject } from "@vjeko.com/al-parser-types-ninja";
import { ConsumptionCache } from "./ConsumptionCache";
import { consumptionToObjects } from "../lib/functions/consumptionToObjects";
import { ConsumptionData } from "../lib/types/ConsumptionData";
import { PropertyBag } from "../lib/types/PropertyBag";
import { EventEmitter } from "vscode";
import { AssignedALObject } from "../lib/types/AssignedALObject";

export class AssigmentMonitor implements Disposable {
    private _assigned: AssignedALObject[] = [];
    private _unassigned: ALObject[] = [];
    private readonly _onAssignmentChanged = new EventEmitter<{ assigned: AssignedALObject[], unassigned: ALObject[] }>();
    public readonly onAssignmentChanged = this._onAssignmentChanged.event;
    readonly _uri: Uri;
    readonly _hash: string;
    readonly _watcher: FileSystemWatcher;
    readonly _disposables: Disposable[] = [];

    readonly _pending = {
        changed: [] as Uri[],
        created: [] as Uri[],
        deleted: [] as Uri[],
    };

    _timeout: NodeJS.Timeout | undefined;
    _objects: ALObject[] | undefined;
    _consumption: ConsumptionData | undefined;
    _diagnosedUris: Uri[] = [];
    _disposed: boolean = false;

    constructor(uri: Uri, hash: string) {
        this._uri = uri;
        this._hash = hash;

        this._watcher = workspace.createFileSystemWatcher(`${this._uri.fsPath}/**/*.al`, false, false, false);

        this._watcher.onDidChange(this.onDidChange, this, this._disposables);
        this._watcher.onDidCreate(this.onDidCreate, this, this._disposables);
        this._watcher.onDidDelete(this.onDidDelete, this, this._disposables);

        this.scheduleRefreshObjects();
        this._disposables.push(
            ConsumptionCache.instance.onConsumptionUpdate(hash, consumption => this.refreshConsumption(consumption))
        );
    }

    private onDidCreate(uri: Uri) {
        if (this._pending.created.some(u => u.fsPath === uri.fsPath)) {
            return;
        }
        this._pending.created.push(uri);
        this.scheduleRefreshObjects();
    }

    private onDidChange(uri: Uri) {
        if (this._pending.changed.some(u => u.fsPath === uri.fsPath)) {
            return;
        }
        this._pending.changed.push(uri);
        this.scheduleRefreshObjects();
    }

    private onDidDelete(uri: Uri) {
        if (this._pending.deleted.some(u => u.fsPath === uri.fsPath)) {
            return;
        }
        this._pending.deleted.push(uri);
        this.scheduleRefreshObjects();
    }

    private scheduleRefreshObjects() {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this._timeout = setTimeout(() => {
            this._timeout = undefined;
            this.refreshObjects();
        }, 125);
    }

    private async getPendingUris() {
        const actualUris = await getWorkspaceFolderFiles(this._uri);

        this._objects =
            this._objects &&
            this._objects.filter(
                object =>
                    actualUris.some(u => u.fsPath === object.path) &&
                    !this._pending.created.some(u => u.fsPath === object.path) &&
                    !this._pending.deleted.some(u => u.fsPath === object.path) &&
                    !this._pending.changed.some(u => u.fsPath === object.path)
            );

        const uris = [
            ...this._pending.created,
            ...this._pending.changed,
            ...actualUris.filter(
                u =>
                    !(this._objects || []).some(o => o.path === u.fsPath) &&
                    !this._pending.created.some(pu => u.fsPath === pu.fsPath) &&
                    !this._pending.deleted.some(pu => u.fsPath === pu.fsPath) &&
                    !this._pending.changed.some(pu => u.fsPath === pu.fsPath)
            ),
        ];

        this._pending.created = [];
        this._pending.changed = [];
        this._pending.deleted = [];

        return uris;
    }

    private async refreshObjects() {
        output.log("Refreshing object ID consumption after change in workspace AL files", LogLevel.Verbose);
        const uris = await this.getPendingUris();
        const objects = await getObjectDefinitions(uris);

        if (!this._objects) {
            this._objects = [];
        }
        this._objects.push(...objects);
        this.refresh();
    }

    private refreshConsumption(consumption: ConsumptionData) {
        this.refreshObjects();
        this._consumption = consumption;
        this.refresh();
    }

    private refresh() {
        if (!this._objects || !this._consumption) {
            return;
        }

        const assignedObjects = consumptionToObjects(this._consumption);

        // Array of object IDs that are assigned (consumed) but do not exist in the workspace
        const assigned = assignedObjects.filter(
            assignedObject =>
                !this._objects!.some(object => object.id === assignedObject.id && object.type === assignedObject.type)
        );
        this._assigned = assigned;

        // Array of object IDs that are not assigned by Ninja but exist in the workspace
        const unassigned = this._objects.filter(
            object =>
                !assignedObjects.some(
                    assignedObject => object.id === assignedObject.id && object.type === assignedObject.type
                )
        );
        this._unassigned = unassigned;

        this._onAssignmentChanged.fire({ assigned, unassigned })

        this.clearDiagnostics();

        let uriCache: PropertyBag<Uri> = {};
        for (let object of unassigned) {
            if (object.hasError) {
                continue;
            }
            if (!uriCache[object.path]) {
                const uri = Uri.file(object.path);
                uriCache[object.path] = uri;
            }

            const objectUri = uriCache[object.path];
            const diagnose = Diagnostics.instance.createDiagnostics(
                objectUri,
                `ninjaunassigned.${object.type}.${object.id}`
            );
            if (!this._diagnosedUris.some(u => u.fsPath === objectUri.fsPath)) {
                this._diagnosedUris.push(objectUri);
            }

            const diagnostic = diagnose(
                new Range(
                    new Position(object.line, object.character),
                    new Position(object.line, object.character + object.id.toString().length)
                ),
                `${object.type} ${object.id} is not assigned with AL Object ID Ninja`,
                DiagnosticSeverity.Warning,
                DIAGNOSTIC_CODE.CONSUMPTION.UNASSIGNED
            );
            diagnostic.data = object;
        }
    }

    public get assigned() {
        return this._assigned;
    }

    public get unassigned() {
        return this._unassigned;
    }

    private clearDiagnostics() {
        for (let uri of this._diagnosedUris) {
            Diagnostics.instance.resetForUri(uri);
        }
        this._diagnosedUris = [];
    }

    dispose() {
        if (this._disposed) {
            return;
        }

        this._watcher.dispose();
        this._disposables.forEach(disposable => disposable.dispose());
        this.clearDiagnostics();
        this._onAssignmentChanged.dispose();

        this._disposed = true;
    }
}
