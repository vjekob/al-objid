import { ConsumptionData } from "../types/ConsumptionData";
import { ALObjectType } from "../types/ALObjectType";

interface AssignedALObject {
    type: ALObjectType;
    id: number;
}

export function consumptionToObjects(consumption: ConsumptionData): AssignedALObject[] {
    const objects: AssignedALObject[] = [];
    for (let key in consumption) {
        const type = key as ALObjectType;
        const ids = consumption[type];
        for (const id of ids) {
            objects.push({
                type,
                id,
            });
        }
    }
    return objects;
}
