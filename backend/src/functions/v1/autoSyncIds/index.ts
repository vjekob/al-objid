import { AzureFunction } from "@azure/functions";
import { Log } from "../../../common/LogCache";
import { RequestHandler } from "../RequestHandler";
import { RequestValidator } from "../RequestValidator";
import { BodyWithAppFolders, BodyWithObjectIds, INVALID_OBJECT_IDS, ObjectIds, OBJECT_IDS_VALIDATION_ERROR, OBJECT_TYPES } from "../../../common/types";
import { updateConsumption, updateConsumptions } from "../../../common/updates";

const httpTrigger: AzureFunction = RequestHandler.handleAppFoldersAuthorized<any, BodyWithAppFolders>(
    async (_, req) => {
        let result: any = {};
        for (let folder of req.body.appFolders) {
            let ids: ObjectIds = (folder as any).ids;
            result[folder.appId] = await updateConsumptions(folder.appId, ids, req.method === "PATCH");
        }
        return result;
    },
    new RequestValidator([
        BodyWithAppFolders.validateAppFoldersWithCustomProperties("ids"),
        {
            rule: (body) => {
                for (let appFolder of body.appFolders as BodyWithObjectIds[]) {
                    let { ids } = appFolder;
                    if (!ids) return OBJECT_IDS_VALIDATION_ERROR.MISSING_IDS;
                    if (typeof ids !== "object") return OBJECT_IDS_VALIDATION_ERROR.INVALID_IDS;
                    for (let type in ids) {
                        if (!OBJECT_TYPES.includes(type)) return OBJECT_IDS_VALIDATION_ERROR.INVALID_TYPE;
                        if (!Array.isArray(ids[type])) return OBJECT_IDS_VALIDATION_ERROR.ARRAY_EXPECTED;
                        for (let n of ids[type]) {
                            if (typeof n !== "number") return OBJECT_IDS_VALIDATION_ERROR.ARRAY_EXPECTED;
                        }
                    }
                }
                return true;
            },
            errorMessage: {
                [OBJECT_IDS_VALIDATION_ERROR.INVALID_TYPE]: `${INVALID_OBJECT_IDS}invalid object type specified`,
                [OBJECT_IDS_VALIDATION_ERROR.ARRAY_EXPECTED]: `${INVALID_OBJECT_IDS}array of number expected`,
                [OBJECT_IDS_VALIDATION_ERROR.INVALID_IDS]: `${INVALID_OBJECT_IDS}must be of type "object"`,
                [OBJECT_IDS_VALIDATION_ERROR.MISSING_IDS]: `${INVALID_OBJECT_IDS}must specify "ids" property`,
            }
        }
    ])
);

export default httpTrigger;
