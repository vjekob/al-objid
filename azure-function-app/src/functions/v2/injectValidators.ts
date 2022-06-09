import { RequestValidator } from "@vjeko.com/azure-func";
import { ALObjectType } from "./ALObjectType";
import { ObjectConsumptions } from "./TypesV2";


function isExtendedIdType(type: string) {
    return (type === "table" || type === "tableextension" || type === "enum" || type === "enumextension");
}

export function injectValidators() {
    RequestValidator.defineValidator("ALObjectType", (value: any) => {
        if (ALObjectType[value]) {
            return true;
        }

        let parts = value.split("_");
        if (parts.length === 2) {
            if (!isExtendedIdType(parts[0])) {
                return `${value} has nothing of interest (fields, or ids) to keep track of`;
            }
            if (!parseInt(parts[1])) {
                return `${parts[0]} id must be a non-zero number`;
            }
            return true;
        }
        return `invalid AL object type "${value}"`;
    });

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
            let keyForIds = key;
            let keyParts = key.split("_");
            if (keyParts.length === 2) {
                key = keyParts[0];
                if (!isExtendedIdType(key)) {
                    return `${keyForIds} has nothing of interest (fields, or ids) to keep track of`;
                }
                if (!parseInt(keyParts[1])) {
                    return `${key} id must be a non-zero number`;
                }
            }
            if (!ALObjectType[key]) {
                return `invalid AL object type "${key}"`;
            }
            if (!Array.isArray(value[keyForIds])) {
                return `array expected for key "${keyForIds}"`;
            }
            for (let num of value[keyForIds]) {
                if (typeof num !== "number") {
                    return `"${keyForIds}" must be an array of "number", but "${typeof num}" was found`;
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

    RequestValidator.defineValidator("string!", (value) => {
        if (typeof value !== "string") {
            return `string expected, received "${typeof value}"`;
        }
        if (value.trim() === "") {
            return `value must be defined`;
        }
        return true;
    });

    RequestValidator.defineValidator("PoolApp", (value) => {
        if (typeof value !== "object" || !value) {
            return `non-null object expected, received "${typeof value}"`;
        }
        if (typeof value.appId !== "string" || value.appId.trim() === "") {
            return `appId must be "string" (with a defined value), it is "${typeof value.appId}"`;
        }
        if (typeof value.name !== "string") {
            return `name must be "string" (with a defined value), it is "${typeof value.name}"`;
        }
        return true;
    });
}
