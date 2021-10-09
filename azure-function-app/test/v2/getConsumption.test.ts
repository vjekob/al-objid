import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import { Blob } from "@vjeko.com/azure-func";
import { StubStorage } from "../AzureTestLibrary/v2/Storage.stub";
import { initializeCustomMatchers } from "../AzureTestLibrary/CustomMatchers";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";
import getConsumption from "../../src/functions/v2/getConsumption";


jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);
initializeCustomMatchers()

describe("Testing function api/v2/getConsumption", () => {

    it("Correctly retrieves consumptions", async () => {
        const storage = new StubStorage().app().authorize();
        storage.setConsumption(ALObjectType.codeunit, [1, 2, 3]);
        storage.setConsumption(ALObjectType.page, [4, 5, 6]);
        Mock.useStorage(storage.content);
        const context = new Mock.Context(new Mock.Request("GET", { appId: storage.appId, authKey: storage.authKey }));
        await getConsumption(context, context.req);
        expect(context.res).toBeStatus(200);
        expect(storage).not.toHaveChanged();
        expect(context.res.body).toEqual({
            _total: 6,
            codeunit: [1, 2, 3],
            page: [4, 5, 6]
        });
    });

    it("Fails to retrieve consumptions for unknown app", async () => {
        Mock.useStorage({});
        const context = new Mock.Context(new Mock.Request("GET", { appId: "_mock_" }));
        await getConsumption(context, context.req);
        expect(context.res).toBeStatus(404);
    });
});
