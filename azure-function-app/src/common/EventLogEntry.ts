/**
 * Represents an entry in the event log
 */

export interface EventLogEntry {
    eventType: string;
    timestamp: number;
    user: string;
    data: any;
}
