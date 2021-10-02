import { Blob } from "../../../common/Blob";
import { ALObjectType } from "../ALObjectType";

function writeDataToObject(target: any, key: string, data: any) {
    if (!data) {
        return;
    }
    target[key] = data;
}

async function readThenDelete(path: string): Promise<any> {
    const blob = new Blob(path);
    const result = await blob.read();
    await blob.delete();
    return result;
}

export async function migrateV1toV2(appId: string) {
    // TODO: get lease on the _ranges.json, nobody can do anything while there is a lease on that file
    let app = {};
    let promises = [];
    for (let objectType of Object.values(ALObjectType)) {
        promises.push(readThenDelete(`${appId}/${objectType}.json`).then(data => writeDataToObject(app, objectType, data)));
    }
    promises.push(readThenDelete(`${appId}/_authorization.json`).then(data => writeDataToObject(app, "_authorization", data)));
    promises.push(readThenDelete(`${appId}/_ranges.json`).then(data => writeDataToObject(app, "_ranges", data)));
    await Promise.all(promises);
    let appBlob = new Blob(`${appId}.json`);
    await appBlob.optimisticUpdate(() => app);
    // TODO: release the lease
}
