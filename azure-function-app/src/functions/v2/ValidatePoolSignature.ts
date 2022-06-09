import { createPublicKey, createVerify } from "crypto";
import { AppInfo, PoolRequest } from "./TypesV2";

export function validatePoolSignature(app: AppInfo, poolId: string, { timestamp, signature }: PoolRequest): boolean {
    const verify = createVerify("RSA-SHA256");
    verify.write(`${poolId}:${timestamp}`);
    verify.end();

    const publicKey = createPublicKey({ key: Buffer.from(app._pool.managementKey.public, "base64"), format: "der", type: "spki" });
    return verify.verify(publicKey, signature, "base64");
}
