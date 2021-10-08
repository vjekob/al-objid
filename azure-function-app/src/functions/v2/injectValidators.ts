import { RequestValidator } from "@vjeko.com/azure-func";
import { ALObjectType } from "./ALObjectType";

export function injectValidators() {
    RequestValidator.defineValidator("ALObjectType", (value: any) => !!ALObjectType[value] || `invalid AL object type "${value}"`);
    RequestValidator.defineValidator("Range", (value: any) => {
        if (typeof value !== "object" || !value) return `Range expected, received "${typeof value}"`;
        if (!value.hasOwnProperty("from") || typeof value.from !== "number") return `invalid Range.from specification, "number" expected, received "${typeof value.from}"`;
        if (!value.hasOwnProperty("to") || typeof value.to !== "number") return `invalid Range.to specification, "number" expected, received "${typeof value.to}"`;
        return true;
    });
}
