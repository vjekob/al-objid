import { Mock } from "@vjeko.com/azure-func-test";
import * as azure from "azure-storage";
import news from "../../src/functions/v2/news";
import { Blob } from "@vjeko.com/azure-func";

jest.mock("azure-storage");
Blob.injectCreateBlobService(azure.createBlobService);
Mock.initializeStorage(azure.createBlobService);

describe("Testing function api/v2/news", () => {
    it("Succeeds on reading news", async () => {
        Mock.useStorage({
            "news.json": [
                {
                    "id": "test01",
                    "type": "announcement",
                    "message": "This is a test announcement",
                    "buttons": [
                        {
                            "caption": "OK",
                            "action": "dismiss"
                        },
                        {
                            "caption": "Snooze",
                            "action": "snooze",
                            "parameter": 60
                        },
                        {
                            "caption": "Learn more",
                            "action": "url",
                            "parameter": "https://vjeko.com/2021/10/01/important-announcement-for-al-object-id-ninja/"
                        }
                    ]
                }
            ]
        });
        const context = new Mock.Context(new Mock.Request("GET"));
        await news(context, context.req);
        expect(context.res.status).toBe(200);
        expect(context.res.body.news).toBeDefined();
        expect(Array.isArray(context.res.body.news)).toBe(true);
        expect(context.res.body.news[0].id).toBe("test01");
        expect(Array.isArray(context.res.body.news[0].buttons)).toBe(true);
        expect(context.res.body.news[0].buttons.length).toBe(3);
    });
});
