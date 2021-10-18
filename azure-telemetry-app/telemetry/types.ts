export interface TelemetryRequest {
    userSha: string;
    appSha: string;
    event: string;
    context: any;
}

export interface TelemetryEntry extends TelemetryRequest {
    timestamp: number;
    instanceId: string;
    instanceCallNo: number;
};
