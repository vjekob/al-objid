import { ALObjectType } from "../src/functions/v2/ALObjectType";
import { AzureTestLibrary } from "./AzureTestLibrary";

jest.mock("azure-storage");

describe("Testing function api/v1/getLog", () => {
    const azureFunction = new AzureTestLibrary.Fake.AzureFunction("../src/functions/v1/getLog");

    it("Fails unconditionally for not being supported anymore", async () => {
        await expect(azureFunction).toFail("GET", 410);
    });
});