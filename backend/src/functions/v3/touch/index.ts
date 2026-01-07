import { AzureHttpHandler, createEndpoint, HttpStatusCode } from "../../../http";
import { ActivityLogger } from "../../../activity";

interface TouchRequest {
    apps: string[];      // Array of app GUIDs
    feature: string;     // Feature identifier
}

const post: AzureHttpHandler<TouchRequest, void> = async (req) => {
    const { apps, feature } = req.body;

    // Graceful validation - return 204 on invalid input (no errors thrown)
    if (!apps || !Array.isArray(apps) || apps.length === 0) {
        req.setStatus(HttpStatusCode.Success_204_NoContent);
        return;
    }

    if (!feature || typeof feature !== "string") {
        req.setStatus(HttpStatusCode.Success_204_NoContent);
        return;
    }

    // Extract email from headers
    const email = req.user?.email || "";

    if (!email) {
        // No email - skip logging (silently)
        req.setStatus(HttpStatusCode.Success_204_NoContent);
        return;
    }

    // Log touch activity for all apps
    try {
        await ActivityLogger.logTouchActivity(apps, email, feature);
    } catch (err) {
        // Graceful error handling - log but don't fail the request
        console.error("Touch activity logging failed:", err);
    }

    req.setStatus(HttpStatusCode.Success_204_NoContent);
};

export const touch = createEndpoint({
    moniker: "v3-touch",
    route: "v3/touch",
    POST: post
});
