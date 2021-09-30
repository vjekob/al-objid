jest.mock("azure-storage");

describe("Testing function api/v2/getNext", () => {
    it("Succeeds on blank test - temporary", () => {
        expect({ a: "b" }).toEqual({ a: "b" });
    });
});
