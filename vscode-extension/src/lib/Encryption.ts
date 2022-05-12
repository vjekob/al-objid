import * as crypto from "crypto";
import { output } from "../features/Output";
import { getAppEncryptionKey } from "./__AppManifest_obsolete_";

const ALGORITHM = "aes-256-cbc";
var IV_LENGTH = 16;
const IV_SEPARATOR = "?";

export function encrypt(text: string, appId: string): string | undefined {
    try {
        const key = Buffer.from(getAppEncryptionKey(appId), "utf-8");
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, "utf-8", "base64");
        encrypted += cipher.final("base64");
        return `${iv.toString("base64")}${IV_SEPARATOR}${encrypted}`;
    } catch (error: any) {
        output.log(`An error occurred while encrypting: ${(error && error.message) || error}`);
    }
}

export function decrypt(encrypted: string, appId: string): string | undefined {
    try {
        const key = Buffer.from(getAppEncryptionKey(appId), "utf-8");
        const parts = encrypted.split(IV_SEPARATOR);
        const iv = Buffer.from(parts[0], "base64");
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(parts[1], "base64", "utf-8");
        decrypted += decipher.final("utf-8");
        return decrypted;
    } catch (error: any) {
        output.log(`An error occurred while decrypting: ${(error && error.message) || error}`);
    }
}
