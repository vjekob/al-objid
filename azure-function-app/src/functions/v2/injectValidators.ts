import { RequestValidator } from "@vjeko.com/azure-func";
import { ALObjectType } from "./ALObjectType";
import { ObjectConsumptions } from "./TypesV2";

export function injectValidators() {
    RequestValidator.defineValidator("ALObjectType", (value: any) => !!ALObjectType[value] || `invalid AL object type "${value}"`);

    RequestValidator.defineValidator("Range", (value: any) => {
        if (typeof value !== "object" || !value) return `Range expected, received "${typeof value}"`;
        if (!value.hasOwnProperty("from") || typeof value.from !== "number") return `invalid Range.from specification, "number" expected, received "${typeof value.from}"`;
        if (!value.hasOwnProperty("to") || typeof value.to !== "number") return `invalid Range.to specification, "number" expected, received "${typeof value.to}"`;
        return true;
    });

    function validateObjectConsumptions(value: ObjectConsumptions) {
        if (typeof value !== "object" || !value) {
            return `object expected, received "${typeof value}"`;
        }
        for (let key of Object.keys(value)) {
            if (!ALObjectType[key]) {
                return `invalid AL object type "${value}"`;
            }
            if (!Array.isArray(value[key])) {
                return `array expected for key "${key}"`;
            }
            for (let num of value[key]) {
                if (typeof num !== "number") {
                    return `"${key}" must be an array of "number", but "${typeof num}" was found`;
                }
            }
        }
        return true;
    }

    RequestValidator.defineValidator("ObjectIDs", validateObjectConsumptions);

    RequestValidator.defineValidator("PerAppObjectIDs", (value) => {
        if (!Array.isArray(value)) {
            return `array expected, received "${typeof value}"`;
        }
        for (let key of Object.keys(value)) {
            let app = value[key];
            if (typeof app !== "object" || !app) {
                return `non-null object expected, received "${typeof app}"`;
            }
            if (typeof app.appId !== "string") {
                return `appId must be "string", it is "${typeof app.appId}"`;
            }
            if (typeof app.ids !== "object" || !app.ids) {
                return `ids must be "object", it is "${typeof app.ids}"`;
            }
            let result = validateObjectConsumptions(app.ids);
            if (result !== true) {
                return result;
            }
        }
        return true;
    });
}
