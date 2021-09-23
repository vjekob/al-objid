import { ALObjectType } from "./ALObjectType";

interface ExpectTemplate {
    [key: string]: string;
}

const TypeValidator: { [key: string]: (value: any) => true | string } = {
    "number": (value: any) => typeof value === "number" || `number expected, received "${typeof value}"`,
    "ALObjectType": (value: any) => !!ALObjectType[value] || `invalid AL object type "${value}"`,
    "Range": (value: any) => {
        if (typeof value !== "object" || !value) return `Range expected, received "${typeof value}"`;
        if (!value.hasOwnProperty("from") || typeof value.from !== "number") return `invalid Range.from specification, "number" expected, received "${typeof value.from}"`;
        if (!value.hasOwnProperty("to") || typeof value.to !== "number") return `invalid Range.to specification, "number" expected, received "${typeof value.to}"`;
        return true;
    },
    "NonZeroNumber": (value: any) => typeof value === "number" && value && value >= 1 || `non-zero number expected, received ${value}`,
}

const VALID_TYPES = Object.keys(TypeValidator);

export class RequestValidator {
    private _expectTemplate: ExpectTemplate;

    public validate(body: any): string | undefined {
        for (let propertyExpected of Object.keys(this._expectTemplate)) {
            let property = propertyExpected;
            let optional = false;
            if (propertyExpected.endsWith("?")) {
                optional = true;
                property = propertyExpected.substr(0, propertyExpected.length - 1);
            }

            if (!body.hasOwnProperty(property)) {
                if (optional) continue;
                return `Request does not contain property "${property}"`;
            }

            let expectedType = this._expectTemplate[propertyExpected];
            let values = body[property];
            if (expectedType.endsWith("[]")) {
                if (!Array.isArray(values)) return `Property "${property}" must be an array`;
                expectedType = expectedType.substr(0, expectedType.length - 2);
            } else {
                values = [values];
            }

            for (let value of values) {
                let result = TypeValidator[expectedType](value);
                if (result !== true) return `Validation failed for "${property}": ${result}`;
            }
        }
    }

    public expect(template: ExpectTemplate) {
        if (typeof template !== "object" || !template) {
            throw new Error("Validator expect template must be an object.");
        }
        for (let key of Object.keys(template)) {
            let type = template[key];
            if (type.endsWith("[]")) {
                type = type.substr(0, type.length - 2);
            }
            if (!VALID_TYPES.includes(type)) {
                throw new Error(`Validator expect template specifies incorrect type for property "${key}": ${type}. Valid types are: ${VALID_TYPES}`)
            }
        }
        this._expectTemplate = template;
    }
}
