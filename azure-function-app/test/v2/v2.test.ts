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

    it("Fails on validating invalid ALObjectType type", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ALObjectType": "ALObjectType" });
        const request = new Mock.Request("GET", { "ALObjectType": 3.14 });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid ALObjectType array", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ALObjectType": "ALObjectType[]" });
        const request = new Mock.Request("GET", { "ALObjectType": ["codeunit", "unitcode", "page"] });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Succeeds on validating valid ALObjectType array", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ALObjectType": "ALObjectType[]" });
        const request = new Mock.Request("GET", { "ALObjectType": ["codeunit", "table", "page"] });
        expect(() => validator.validate(request)).not.toThrowError();
    });

    it("Fails on validating invalid type: specific page with id", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ALObjectType": "ALObjectType" });
        const request = new Mock.Request("GET", { "ALObjectType": "page_12" });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Succeeds on validating valid type: specific table with id", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ALObjectType": "ALObjectType" });
        const request = new Mock.Request("GET", { "ALObjectType": "table_12" });
        expect(() => validator.validate(request)).not.toThrowError();
    });

    it("Fails on validating invalid type: specific table with non-number id", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ALObjectType": "ALObjectType" });
        const request = new Mock.Request("GET", { "ALObjectType": "table_fail" });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid type: specific table with zero id", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ALObjectType": "ALObjectType" });
        const request = new Mock.Request("GET", { "ALObjectType": "table_0" });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Succeeds on validating valid types that include ID", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ALObjectType": "ALObjectType[]" });
        const request = new Mock.Request("GET", { "ALObjectType": ["table_1", "tableextension_2", "enum_3", "enumextension_4"] });
        expect(() => validator.validate(request)).not.toThrowError();
    });

    it("Fails on validating invalid ObjectIDs type", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ObjectIDs": "ObjectIDs" });
        const request = new Mock.Request("GET", { "ObjectIDs": 3.14 });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid ObjectIDs specification (numbers, apples, oranges)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ObjectIDs": "ObjectIDs" });
        const request = new Mock.Request("GET", { "ObjectIDs": { codeunit: 1, table: [1, "apple", "orange"] } });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid ObjectIDs specification (incorrect ALObjectType 'record')", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ObjectIDs": "ObjectIDs" });
        const request = new Mock.Request("GET", { "ObjectIDs": { codeunit: [1, 2], record: [1, 2] } });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid extended ObjectIDs specification (incorrect ALObjectType 'table_0')", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ObjectIDs": "ObjectIDs" });
        const request = new Mock.Request("GET", { "ObjectIDs": { codeunit: [1, 2], table_0: [1, 2] } });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid extended ObjectIDs specification (incorrect ALObjectType 'codeunit_1')", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ObjectIDs": "ObjectIDs" });
        const request = new Mock.Request("GET", { "ObjectIDs": { codeunit: [1, 2], codeunit_1: [1, 2] } });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Succeeds on validating valid ObjectIDs specification", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ObjectIDs": "ObjectIDs" });
        const request = new Mock.Request("GET", { "ObjectIDs": { codeunit: [12, 13], table: [15, 16] } });
        expect(() => validator.validate(request)).not.toThrowError();
    });

    it("Succeeds on validating valid extended ObjectIDs specification", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "ObjectIDs": "ObjectIDs" });
        const request = new Mock.Request("GET", { "ObjectIDs": { table_1: [12, 13], tableextension_2: [15, 16], enum_1: [12, 13], enumextension_2: [15, 16] } });
        expect(() => validator.validate(request)).not.toThrowError();
    });

    it("Fails on validating invalid PerAppObjectIDs specification (ObjectIDs present instead)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "PerAppObjectIDs": "PerAppObjectIDs" });
        const request = new Mock.Request("GET", { "PerAppObjectIDs": { codeunit: 1, table: [1, "apple", "orange"] } });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid PerAppObjectIDs specification (missing appId property)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "PerAppObjectIDs": "PerAppObjectIDs" });
        const request = new Mock.Request("GET", {
            "PerAppObjectIDs": [
                { test: "app1", ids: { codeunit: [1, 2], table: [1, 2] } },
                { mock: "app2", ids: "apple" },
            ],
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid PerAppObjectIDs specification (missing ids property)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "PerAppObjectIDs": "PerAppObjectIDs" });
        const request = new Mock.Request("GET", {
            "PerAppObjectIDs": [
                { appId: "app1", IDs: { codeunit: [1, 2], table: [1, 2] } },
                { appId: "app2", IDs: "apple" },
            ],
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid PerAppObjectIDs specification (invalid single ObjectIDs specification inside)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "PerAppObjectIDs": "PerAppObjectIDs" });
        const request = new Mock.Request("GET", {
            "PerAppObjectIDs": [
                { appId: "app1", ids: { codeunit: [1, 2], table: [1, 2] } },
                { appId: "app2", ids: "apple" },
            ],
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid PerAppObjectIDs specification (invalid ALObjectType inside)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "PerAppObjectIDs": "PerAppObjectIDs" });
        const request = new Mock.Request("GET", {
            "PerAppObjectIDs": [
                { appId: "app1", ids: { codeunit: [1, 2], table: [1, 2] } },
                { appId: "app2", ids: { codeunit: [1, 2], record: [1, 2] } },
            ],
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Succeeds on validating valid PerAppObjectIDs specification", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "PerAppObjectIDs": "PerAppObjectIDs" });
        const request = new Mock.Request("GET", {
            "PerAppObjectIDs": [
                { appId: "app1", ids: { codeunit: [1, 2], table: [1, 2] } },
                { appId: "app2", ids: { codeunit: [1, 2], page: [1, 2] } },
            ],
        });
        expect(() => validator.validate(request)).not.toThrowError();
    });

    it("Fails on validating invalid string! (invalid type)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "test": "string!" });
        const request = new Mock.Request("GET", {
            "test": false,
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid string! (empty value)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "test": "string!" });
        const request = new Mock.Request("GET", {
            "test": "",
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid string! (empty trimmed value)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "test": "string!" });
        const request = new Mock.Request("GET", {
            "test": " ",
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Succeeds on validating valid string!", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "test": "string!" });
        const request = new Mock.Request("GET", {
            "test": "defined",
        });
        expect(() => validator.validate(request)).not.toThrowError();
    });

    it("Fails on validating invalid PoolApp (not object)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "test": "PoolApp" });
        const request = new Mock.Request("GET", {
            "test": 3.14,
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid PoolApp (not valid object)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "test": "PoolApp" });
        const request = new Mock.Request("GET", {
            "test": {},
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Fails on validating invalid PoolApp (not valid properties)", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "test": "PoolApp" });
        const request = new Mock.Request("GET", {
            "test": {
                appId: 3.14,
                name: false
            },
        });
        expect(() => validator.validate(request)).toThrowError();
    });

    it("Succeeds on validating valid PoolApp", () => {
        injectValidators();
        const validator = new RequestValidator();
        validator.expect("body", { "test": "PoolApp" });
        const request = new Mock.Request("GET", {
            "test": {
                appId: "id",
                name: "name"
            },
        });
        expect(() => validator.validate(request)).not.toThrowError();
    });
});
