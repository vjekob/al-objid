export interface ALRange {
    from: number;
    to: number;
}

export interface ALRanges extends Array<ALRange> {
    mandatory?: boolean;
}
