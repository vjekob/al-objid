//TODO Move each back-end type into its own file

export interface NextObjectIdInfo {
    id: number | number[];
    updated: boolean;
    available: boolean;
    updateAttempts: number;
    hasConsumption: boolean;
    perRange?: boolean;
    require?: number;
}
