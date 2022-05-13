import { ConsumptionInfo } from "../types/ConsumptionInfo";

export interface AuthorizedAppConsumption {
    appId: string;
    authKey: string;
    ids: ConsumptionInfo;
}
