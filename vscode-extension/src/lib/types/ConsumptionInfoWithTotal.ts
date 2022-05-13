import { ConsumptionInfo } from "./ConsumptionInfo";

export type ConsumptionInfoWithTotal =
    | ConsumptionInfo
    | {
          _total: number;
      };
