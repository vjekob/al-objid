import { Blob } from "./Blob";
import { ObjectIds, OBJECT_TYPES, PoolInfo, PoolReference, Range, RejectionInfo } from "./types";
import { AppAuthorization } from "./AppAuthorization";
import { findFirstAvailableId, getSha256 } from "./util";

export async function updateRanges(appId: string, ranges: Range[]): Promise<Range[]> {
    const blob = new Blob<Range[]>(`${appId}/_ranges.json`);
    return await blob.optimisticUpdate(() => ranges);
}

export interface ConsumptionUpdateContext {
    id: number;
    available: boolean;
    updated: boolean;
    updateAttempts: number;
}

export function getBlobName(appId: string, type: string): string {
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

        if (attempts === 100) {
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
        return [...ids, context.id].sort((left, right) => left - right);
    });

    return !tooManyAttempts;
}

export async function updateConsumptions(appId: string, objectIds: ObjectIds, patch: boolean): Promise<ObjectIds> {
    let result: ObjectIds = {};
    for (let type of OBJECT_TYPES) {
        let ids = objectIds[type] || [];
        let blob = new Blob<number[]>(getBlobName(appId, type));
        result[type] = await blob.optimisticUpdate(existing => {
            let result = [
                ...(patch ? existing : []),
                ...ids
            ];
            return [...new Set(result)].sort((left, right) => left - right);
        });
    }
    return result;
}

export async function readAppAuthorization(appId: string): Promise<AppAuthorization> {
    const blob = new Blob<AppAuthorization>(getBlobName(appId, "_authorization"));
    const result = await blob.read(true);
    return result;
}

export async function writeAppAuthorization(appId: string): Promise<string> {
    const key = getSha256(`APP_AUTH_${appId}_${Date.now()}`, "base64");
    const blob = new Blob<AppAuthorization>(getBlobName(appId, "_authorization"));
    const authorization = await blob.optimisticUpdate(auth => ({
        key,
        valid: true,
    }));

    return authorization.key;
}

export async function removeAppAuthorization(appId: string): Promise<boolean> {
    const blob = new Blob<AppAuthorization>(getBlobName(appId, "_authorization"));
    return await blob.delete();
}

export async function createAppPool(poolId: string, ownerAppId: string, ranges: Range[]): Promise<PoolInfo> {
    const blob = new Blob<PoolInfo>(`pool/${poolId}.json`);
    return await blob.optimisticUpdate(() => {
        return {
            ownerApp: ownerAppId,
            ranges,
            apps: [ownerAppId]
        };
    });
}

export async function joinAppToPool(poolId: string, appId: string) {
    const promises = [];

    promises.push(new Blob<PoolInfo>(`pool/${poolId}.json`).optimisticUpdate((pool) => {
        let apps: string[] = (pool && pool.apps) || [];
        return (apps.includes(appId))
            ? pool
            : {
                ...pool,
                apps: [...apps, appId]
            };
    }));

    promises.push(new Blob<PoolReference>(getBlobName(appId, "_pool")).optimisticUpdate(() => {
        return { poolId };
    }));

    await Promise.all(promises);
}

export async function logRejection(appId: string, endpoint: string, ipAddress: string) {
    const blob = new Blob<RejectionInfo[]>("0/rejections.json");
    try {
        await blob.optimisticUpdate(entries => {
            let result = [...(entries || [])];
            result.push({
                dateTime: new Date().toString(),
                appId,
                endpoint,
                ipAddress,
            });
            return result;
        });
    } catch (e) {
        debugger;
    }
}