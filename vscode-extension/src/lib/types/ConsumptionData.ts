import { ALObjectType } from "../constants";

export type ConsumptionData = {
    [key in ALObjectType]: number[];
};
