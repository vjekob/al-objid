import { ErrorResponse } from "../../../common/ErrorResponse";

export default async () => new ErrorResponse("Obsoleted. [STATUS_REASON=GENERIC]", 410);
