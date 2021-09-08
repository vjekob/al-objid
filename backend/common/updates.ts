import { Blob } from "./Blob";
import { AppAuthorization, ObjectIds, OBJECT_TYPES, Range } from "./types";
import { findFirstAvailableId } from "./util";
import crypto = require("crypto");

export async function updateRanges(appId: string, ranges: Range[]): Promise<Range[]> {
    const blob = new Blob<Range[]>(`${appId}/_ranges.json`);
    return await blob.optimisticUpdate(() => ranges);
};

export interface ConsumptionUpdateContext {
    id: number;
    available: boolean;
    updated: boolean;
    updateAttempts: number;
};

function getBlobName(appId: string, type: string): string {
    return `${appId}/${type.toLowerCase()}.json`;
}

export async function updateConsumption(appId: string, type: string, ranges: Range[], context: ConsumptionUpdateContext): Promise<boolean> {
    let tooManyAttempts = false;

    const blob = new Blob<number[]>(getBlobName(appId, type));
    await blob.optimisticUpdate(function (ids, attempts) {
        context.updated = false;
        context.updateAttempts = attempts;

        // No ids consumed yet, consume the first one and exit
        if (!ids) {
            context.updated = true;
            return [context.id];
        }

        if (attempts === 50) {
            tooManyAttempts = true;
            return ids;
        }

        if (ids.indexOf(context.id) >= 0) {
            // Somebody has consumed this id in the meantime, retrieve the new one
            context.id = findFirstAvailableId(ranges, ids);

            // If id is 0, then there are no numbers left, return the same array
            if (context.id === 0) {
                context.available = false;
                return ids;
            }
        }

        context.updated = true;
        return [...ids, context.id].sort();
    });

    return !tooManyAttempts;
};

export async function updateConsumptions(appId: string, objectIds: ObjectIds): Promise<ObjectIds> {
    let result: ObjectIds = {};
    for (let type of OBJECT_TYPES) {
        let ids = objectIds[type] || [];
        let blob = new Blob<number[]>(getBlobName(appId, type));
        result[type] = await blob.optimisticUpdate(() => [...new Set(ids.sort())]);
    }
    return result;
}

export async function readAppAuthorization(appId: string): Promise<AppAuthorization> {
    const blob = new Blob<AppAuthorization>(getBlobName(appId, "_authorization"));
    const result = await blob.read(true);
    return result;
}

export async function writeAppAuthorization(appId: string): Promise<string> {
    const sha1 = crypto.createHash("sha256");
    sha1.update(`APP_AUTH_${appId}_${Date.now()}`);
    const blob = new Blob<AppAuthorization>(getBlobName(appId, "_authorization"));
    const authorization = await blob.optimisticUpdate(auth => ({
        key: sha1.digest("base64"),
        valid: true,
    }));

    return authorization.key;
}

export async function removeAppAuthorization(appId: string): Promise<boolean> {
    const blob = new Blob<AppAuthorization>(getBlobName(appId, "_authorization"));
    return await blob.delete();
}
