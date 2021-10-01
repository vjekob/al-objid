import { AzureFunction } from "@azure/functions";
import { RequestHandler } from "../RequestHandler";
import { ErrorResponse } from "../../../common/ErrorResponse";

const httpTrigger: AzureFunction = RequestHandler.handle<any, any>(
    async () => new ErrorResponse("Invoke v2/getLog instead. [STATUS_REASON=OLD_VERSION]", 410)
);

export default httpTrigger;
