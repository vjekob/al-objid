import { AzureFunction } from "@azure/functions";
import { Blob } from "../common/Blob";
import { RequestHandler } from "../common/RequestHandler";
import { RequestValidator } from "../common/RequestValidator";
import { BodyWithAppId, ObjectIds, OBJECT_TYPES } from "../common/types";
import { getBlobName } from "../common/updates";

type ObjectIdsWithTotal = ObjectIds | {
    _total: number;
}
const getUpdateType = (types: ObjectIdsWithTotal, type: string) => (content: number[]) => {
    if (content) {
        types[type] = content;
        types._total =  (types._total as number) + content.length;
    }
};

const httpTrigger: AzureFunction = RequestHandler.handleAuthorized<any, BodyWithAppId>(
    async (context, req) => {
        let result: ObjectIdsWithTotal = {
            _total: 0
        };
        let { appId } = req.body;
        let promises = [];
        for (let type of OBJECT_TYPES) {
            let blob = new Blob<number[]>(getBlobName(appId, type));
            promises.push(blob.read().then(getUpdateType(result, type)));
        }
        await Promise.all(promises);
        return result;
    },
    new RequestValidator([BodyWithAppId.validateAppId])
);

export default httpTrigger;
