export interface TelemetryRequest {
    ownEndpoints?: boolean;
    userSha?: string;
    appSha?: string;
    event: string;
    context?: any;
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
