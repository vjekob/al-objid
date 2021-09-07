import { HttpRequest } from "@azure/functions";

export interface ValidatorRule<T> {
    rule: (body: T) => boolean | symbol;
    errorMessage: ((body: T) => string) | string | { [key: symbol]: ((body: T) => string) | string };
}

type ValidatorDefinition = ValidatorRule<any> | ValidatorRule<any>[];

export class RequestValidator {
    static getPropertyPresenceValidationRule(property: string): ValidatorRule<any> {
        return ({
            rule: (body: any) => body[property] !== undefined,
            errorMessage: `Missing property: ${property}`
        });
    }

    static getPropertyTypeValidationRule(property: string, expected: string): ValidatorRule<any> {
        return ({
            rule: (body: any) => typeof body[property] === expected,
            errorMessage: (body: any) => `Invalid type for property [${property}]". Expected "${expected}", actual "${typeof body[property]}"`
        });
    }

    static getPropertyIsArrayValidationRule(property: string): ValidatorRule<any> {
        return ({
            rule: (body: any) => Array.isArray(body[property]),
            errorMessage: (body: any) => `Invalid type for property [${property}]. Array expected, actual "${typeof body[property]}"`
        });
    }

    static getPropertyArrayMinLengthRule(property: string, minLength: number): ValidatorRule<any> {
        return ({
            rule: (body: any) => (body[property] as any[]).length >= minLength,
            errorMessage: `Invalid array length for property [${property}]. At least ${minLength} elements expected.`
        });
    }

    private _rules: ValidatorRule<any>[] = [];
    private _validationError: string | null;

    private returnError(error: string): boolean {
        this._validationError = error;
        return false;
    }

    constructor(validators: ValidatorDefinition[]) {
        for (let validator of validators) {
            if (Array.isArray(validator)) {
                this._rules.push(...validator);
            } else {
                this._rules.push(validator);
            }
        }
    }

    validate({ body }: HttpRequest): boolean {
        for (let rule of this._rules) {
            let result = rule.rule(body);
            if (typeof result === "symbol" || result === false) {
                switch (typeof rule.errorMessage) {
                    case "string": return this.returnError(rule.errorMessage);
                    case "object":
                        const error = rule.errorMessage[result as symbol];
                        switch (typeof error) {
                            case "string": return this.returnError(error);
                            case "function": return this.returnError(error(body));
                            case "undefined": return this.returnError("Unknown validation error has occurred: symbol undefined");
                        }
                    case "function": return this.returnError(rule.errorMessage(body));
                }
            }
        }
        return true;
    }

    get validationError(): string {
        return this._validationError;
    }
}
