import { createPublicKey, createVerify } from "crypto";

export function validatePoolSignature(key: string, payload: string, signature: string): boolean {
    const verify = createVerify("RSA-SHA256");
    verify.write(payload);
    verify.end();

    const publicKey = createPublicKey({ key: Buffer.from(key, "base64"), format: "der", type: "spki" });
    return verify.verify(publicKey, signature, "base64");
}
