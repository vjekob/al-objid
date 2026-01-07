import { Blob } from "@vjeko.com/azure-blob";
import { AzureHttpHandler, createEndpoint } from "../../../http";
import { AppInfo } from "../../../types";

// GET - Check if app exists
// Returns "true" if app exists, "false" if it doesn't (as lowercase string)
const get: AzureHttpHandler<void, string> = async (req) => {
    const appId = req.params?.appId as string;
    
    if (!appId) {
        return "false";
    }

    const blob = new Blob<AppInfo>(`apps://${appId}.json`);
    const app = await blob.read();

    return app ? "true" : "false";
};

export const checkApp = createEndpoint({
    moniker: "v3-checkApp",
    route: "v3/checkApp/{appId}",
    GET: get,
});
