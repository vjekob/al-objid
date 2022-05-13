export interface BackEndAppInfo {
    hash: string;
    authKey: string;
    encrypt: (value: string) => string | undefined;
    decrypt: (value: string) => string | undefined;
}
