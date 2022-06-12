import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { generateKeyPairSync, randomBytes, RSAKeyPairOptions } from "crypto";
import { CreatePoolRequest, CreatePoolResponse } from "./types";
import { getSha256 } from "../../../common/util";
import { encrypt } from "../../../common/Encryption";
import { Blob } from "@vjeko.com/azure-func";
import { AppInfo } from "../TypesV2";

const createPool = new ALNinjaRequestHandler<CreatePoolRequest, CreatePoolResponse>(async (request) => {
    const { name, joinKey, managementSecret, apps = [], allowAnyAppToManage } = request.body;

    const modulusLength = 2048;
    const publicExponent = 0x10101;
    const publicKeyEncoding = {
        type: "spki",
        format: "der"
    };
    const privateKeyEncoding = {
        type: "pkcs8",
        format: "der",
        cipher: "aes256",
        passphrase: managementSecret
    };

    const pairManagement = generateKeyPairSync("rsa", {
        modulusLength,
        publicExponent,
        publicKeyEncoding,
        privateKeyEncoding,
    } as RSAKeyPairOptions<"der", "der">);

    const pairValidation = generateKeyPairSync("rsa", {
        modulusLength,
        publicExponent,
        publicKeyEncoding,
        privateKeyEncoding: {
            type: "pkcs8",
            format:"der"
        }
    } as RSAKeyPairOptions<"der", "der">)

    const accessKey = randomBytes(128).toString("base64").substring(0, 32);
    const poolId = getSha256(`managedPool:${name}:${Date.now()}`, "hex");

    const joinLockEncryptionKey = `${joinKey}${poolId}`.substring(0, 32);

    const joinLock = encrypt(`${poolId}${accessKey}`, joinLockEncryptionKey);

    const leaveKeys = apps.reduce((leaveKeys, app) => {
        leaveKeys[app.appId] = randomBytes(64).toString("base64");
        return leaveKeys;
    }, {});

    const blob = new Blob<AppInfo>(`${poolId}.json`);
    await blob.optimisticUpdate(app => {
        if (!app) {
            app = {} as AppInfo;
        }
        app._pool = {
            joinLock,
            info: encrypt(JSON.stringify({ name, apps }), accessKey),
            appIds: apps.map(app => app.appId),
            validationKey: {
                public: pairValidation.publicKey.toString("base64"),
                private: encrypt(pairValidation.privateKey.toString("base64"), joinLockEncryptionKey),
            },
            managementKey: {
                public: pairManagement.publicKey.toString("base64"),
                private: allowAnyAppToManage ? pairManagement.privateKey.toString("base64") : undefined,
            },
            leaveKeys,
        };
        return app;
    });

    return {
        poolId,
        accessKey,
        validationKey: pairValidation.privateKey.toString("base64"),
        managementKey: pairManagement.privateKey.toString("base64"),
        leaveKeys
    };
}, false);

createPool.skipAuthorization();
createPool.validator.expect("body", {
    name: "string!",
    managementSecret: "string!",
    joinKey: "string!",
    "apps?": "PoolApp[]",
    "allowAnyAppToManage?": "boolean",
});

export const disableCreatePoolRateLimit = () => createPool.noRateLimit();

export const run = createPool.azureFunction;
