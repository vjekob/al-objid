import { AzureTestLibrary } from "../AzureTestLibrary";

jest.mock("azure-storage");

describe("Testing function api/v2/getNext", () => {
    const azureFunction = new AzureTestLibrary.Fake.AzureFunction("../src/functions/v2/news");

    it("Succeeds on blank test - temporary", async () => {
        AzureTestLibrary.Fake.useStorage({
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
        const response = await azureFunction.invoke("GET");
        expect(response).toBeStatus(200);
        expect(response.body.news).toBeDefined();
        expect(Array.isArray(response.body.news)).toBe(true);
        expect(response.body.news[0].id).toBe("test01");
        expect(Array.isArray(response.body.news[0].buttons)).toBe(true);
        expect(response.body.news[0].buttons.length).toBe(3);
    });
});
