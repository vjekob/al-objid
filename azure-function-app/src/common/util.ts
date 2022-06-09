import crypto = require("crypto");
import { Range } from "../functions/v2/TypesV2";

/**
 * Finds the first available object ID from the array of ranges and array of consumed IDs.
 * 
 * @param ranges Array of ranges to search for the first available number
 * @param ids Array of already consumed object IDs
 * @returns Next available object ID, or 0 if all numbers are consumed
 */
export function findFirstAvailableId(ranges: Range[], ids: number[]): number {
    // No numbers consumed, return the first number from the first range
    if (!ids.length) return ranges[0].from;

    // Find the first unused number while minding performance
    let i = 0;
    for (let range of ranges) {
        for (let j = range.from; j <= range.to; j++) {
            if (i >= ids.length) return j;

            while (ids[i] < j) {
                if (++i >= ids.length) return j;
            }

            if (ids[i++] > j) return j;
        }
    }

    // All numbers from all ranges are consumed
    return 0;
}

export function findAvailablePerRange(ranges: Range[], ids: number[]): number[] {
    const results = [];
    for (let range of ranges) {
        let result = findFirstAvailableId([range], ids);
        if (result >= range.from && result <= range.to) {
            results.push(result);
        }
    }
    return results;
}

/**
 * Calculates the SHA256 hash of specified content and returns it in specified encoding.
 * 
 * @param content Content to hash
 * @param encoding Encoding to use for output
 * @returns SHA256 hash of the content encoded as specified
 */
export function getSha256(content: string, encoding: "hex" | "base64") {
    const sha256 = crypto.createHash("sha256");
    sha256.update(content);
    return sha256.digest(encoding);
}
