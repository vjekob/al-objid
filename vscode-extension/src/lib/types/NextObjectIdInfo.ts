export interface NextObjectIdInfo {
    id: number | number[];
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
    perRange?: boolean;
    require?: number;
}
