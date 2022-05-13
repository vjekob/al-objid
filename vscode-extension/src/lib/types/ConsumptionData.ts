import { ALObjectType } from "./ALObjectType";

export type ConsumptionData = {
    [key in ALObjectType]: number[];
};
