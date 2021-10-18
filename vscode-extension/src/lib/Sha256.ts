import * as crypto from "crypto";

export function getSha256(input: string): string {
    const sha256 = crypto.createHash("sha256");
    sha256.update(input);
    return sha256.digest("hex");
}
