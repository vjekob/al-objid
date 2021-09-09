import { UserContent } from "./types";
import { logEvent } from "./updates";

export class Log {
    static logConsumption(appId: string, type: string, id: number, content: UserContent): void {
        logEvent(appId, "consumption", content.user, { type, id });
    }
}
