import { RequestValidator } from "@vjeko.com/azure-func";
import { Mock } from "@vjeko.com/azure-func-test";
import { injectValidators } from "../../src/functions/v2/injectValidators";

describe("Testing generic features of api/v2", () => {
    it("Fails on validating invalid Range type", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "range": "Range" });
        const request = new Mock.Request("GET", { "range": 3.14 });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid Range specification", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "range": "Range" });
        const request = new Mock.Request("GET", { "range": { from: 1, until: 2 } });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Succeeds on validating valid Range type", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "range": "Range" });
        const request = new Mock.Request("GET", { "range": { from: 12, to: 15 } });
        expect(() => validator.validate(request)).not.toThrowError();
    });
});
