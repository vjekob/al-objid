export interface TelemetryRequest {
    userSha?: string;
    appSha?: string;
    event: string;
    context?: any;
    version: string;
}

export interface TelemetryEntry extends TelemetryRequest {
    timestamp: number;
    instanceId: string;
    instanceCallNo?: number;
};

export interface TelemetryLog {
    startedAt: number;
    log: TelemetryEntry[];
    lastModifiedAt: number;
    length: number;
}
