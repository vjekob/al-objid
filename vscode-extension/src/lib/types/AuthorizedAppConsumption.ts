import { ConsumptionInfo } from "./ConsumptionInfo";

export interface AuthorizedAppConsumption {
    appId: string;
    authKey: string;
    ids: ConsumptionInfo;
}
