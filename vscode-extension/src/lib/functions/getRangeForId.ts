import { ALRange } from "../types/ALRange";

export function getRangeForId<T extends ALRange>(id: number, ranges: T[]): T | undefined {
    for (let range of ranges) {
        if (id >= range.from && id <= range.to) {
            return range;
        }
    }
}
