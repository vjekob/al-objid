export interface ALRange {
    from: number;
    to: number;
}

export interface NinjaRange extends ALRange {
    shortDescription: string;
    fullDescription: string;
}
