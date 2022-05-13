import { EventType } from "./EventType";

export interface EventLogEntry {
    eventType: EventType;
    timestamp: number;
    user: string;
    data: any;
}
