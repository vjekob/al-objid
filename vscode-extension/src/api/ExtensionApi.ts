import { Uri } from "vscode";
import { WorkspaceManager } from "../features/WorkspaceManager";
import { Backend } from "../lib/backend/Backend";
import { Telemetry } from "../lib/Telemetry";
import { NextObjectIdInfo } from "../lib/types/NextObjectIdInfo";
import { continueWithAssignment } from "../features/completion/completionFunctions";

export class ExtensionApi {
    async suggestIds(uri: Uri, type: string): Promise<number[] | undefined> {
        const app = WorkspaceManager.instance.getALAppFromUri(uri);
        if (!app) {
            return undefined;
        }

        const objectId = await Backend.getNextNo(app, type, app.manifest.idRanges, false);
        Telemetry.instance.logNextNo(app, type, false);

        if (!continueWithAssignment(app, objectId) || !objectId) {
            return undefined;
        }

        if (!objectId) {
            return undefined;
        }

        if (Array.isArray(objectId.id)) {
            return objectId.id as number[];
        }

        return [objectId.id as number];
    }

    async reserveId(uri: Uri, type: string, objectId: number): Promise<number> {
        const app = WorkspaceManager.instance.getALAppFromUri(uri);
        if (!app) {
            return objectId;
        }

        const realId = await Backend.getNextNo(app, type, app.manifest.idRanges, true, objectId as number);
        let changed = false;

        if (realId) {
            const realIdVal = this.getSingleId(realId);
            changed = realIdVal !== 0 && realIdVal !== objectId;
            if (changed) {
                objectId = realIdVal;
            }
        }
        Telemetry.instance.logNextNo(app, type, true, changed);

        return objectId;
    }

    private getSingleId(info: NextObjectIdInfo): number {
        if (!info.id) {
            return 0;
        }

        if (!Array.isArray(info.id)) {
            return info.id as number;
        }

        let ids = info.id as number[];
        if (ids.length === 1) {
            return ids[0];
        }

        return 0;
    }
}
