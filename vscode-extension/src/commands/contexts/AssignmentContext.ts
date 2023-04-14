import { ALApp } from "../../lib/ALApp";
import { ALObjectType } from "../../lib/types/ALObjectType";

export interface AssignmentIdContext {
    app: ALApp;
    objectType: ALObjectType;
    objectId: number;
}
