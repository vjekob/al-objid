import { Position, Range, TextEdit, Uri, WorkspaceEdit, workspace } from "vscode";
import { ALApp } from "../../lib/ALApp";
import { Telemetry, TelemetryEventType } from "../../lib/Telemetry";
import { UI } from "../../lib/UI";
import { Backend } from "../../lib/backend/Backend";
import { DOCUMENTS, LABELS } from "../../lib/constants";
import { showDocument } from "../../lib/functions/showDocument";
import { NextObjectIdInfo } from "../../lib/types/NextObjectIdInfo";
import { LogLevel, output } from "../Output";
import { syncIfChosen } from "./NextObjectIdCompletionProvider";
import { NinjaALRange } from "../../lib/types/NinjaALRange";
import { PropertyBag } from "../../lib/types/PropertyBag";

let _syncDisabled: PropertyBag<boolean> = {};
let _stopAsking = false;

export function stopSyncing(appId: string) {
    _syncDisabled[appId] = true;
}

export function stopAsking() {
    _stopAsking = true;
}

function isIdEqual(left: number | number[], right: number) {
    let leftAsArray = left as number[];

    switch (true) {
        case typeof left === "number":
            return left === right;

        case Array.isArray(left):
            return leftAsArray.length === 1 && leftAsArray[0] === right;
    }

    return false;
}

export async function processAssignmentResult(
    position: Position,
    uri: Uri,
    app: ALApp,
    objectId: NextObjectIdInfo,
    range: NinjaALRange | undefined,
    completionLength: number,
) {
    let replacement = `${objectId.id}`;
    if (!objectId.available) {
        if (range) {
            UI.nextId.showNoMoreInLogicalRangeWarning(range.description).then(result => {
                if (result === LABELS.BUTTON_LEARN_MORE) {
                    showDocument(DOCUMENTS.LOGICAL_RANGES);
                }
            });
        } else {
            syncIfChosen(app, UI.nextId.showNoMoreNumbersWarning());
        }
        replacement = "";
    }

    let replace = new WorkspaceEdit();
    replace.set(uri, [
        TextEdit.replace(new Range(position, position.translate(0, completionLength)), replacement),
    ]);
    await workspace.applyEdit(replace);
}

export async function commitAssignment(
    position: Position,
    uri: Uri,
    type: string,
    app: ALApp,
    completionObjectId: NextObjectIdInfo,
    range: NinjaALRange | undefined
) {
    //TODO Assigning from public range (1..50000) for enum values results in "No more objects..." error
    output.log(`Committing object ID auto-complete for ${type} ${completionObjectId.id}`, LogLevel.Info);
    const realId = await Backend.getNextNo(app, type, app.manifest.idRanges, true, completionObjectId.id as number);
    const changed = realId && !isIdEqual(realId.id, completionObjectId.id as number);
    Telemetry.instance.logNextNo(app, type, true, changed);
    if (!changed) {
        return;
    }
    output.log(
        `Another user has consumed ${type} ${completionObjectId.id} in the meantime. Retrieved new: ${type} ${realId.id}`,
        LogLevel.Info
    );

    await processAssignmentResult(position, uri, app, realId, range, completionObjectId.id.toString().length);
}

export function continueWithAssignment(app: ALApp, objectId?: NextObjectIdInfo): boolean {
    if (!objectId) {
        return false;
    }

    if (!objectId.hasConsumption) {
        if (!_syncDisabled[app.hash] && !_stopAsking) {
            syncIfChosen(app, UI.nextId.showNoBackEndConsumptionInfo(app), choice => {
                switch (choice) {
                    case LABELS.BUTTON_INITIAL_YES:
                        Telemetry.instance.log(TelemetryEventType.AcceptNinja);
                        break;
                    case LABELS.BUTTON_INITIAL_NO:
                        Telemetry.instance.log(TelemetryEventType.RefuseNinja);
                        break;
                    case LABELS.BUTTON_LEARN_MORE:
                        Telemetry.instance.log(TelemetryEventType.LearnAboutNinja);
                        break;
                }
            });
        }
        return false;
    }

    if (!objectId.available) {
        syncIfChosen(app, UI.nextId.showNoMoreNumbersWarning());
        return false;
    }

    return true;
}
