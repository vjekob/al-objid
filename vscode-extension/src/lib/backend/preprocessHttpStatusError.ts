import { HttpStatusHandler } from "../../features/HttpStatusHandler";

export function preprocessHttpStatusError(error: any): boolean {
    if (typeof error === "object" && error) {
        switch (error.statusCode) {
            case 410:
                HttpStatusHandler.instance.handleError410(error.error || "");
                return true;
            case 503:
                HttpStatusHandler.instance.handleError503(error);
                return true;
        }
    }

    return false;
}
