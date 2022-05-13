export interface BackEndAppInfo {
    hash: string;
    encrypt: (value: string) => string | undefined;
    decrypt: (value: string) => string | undefined;
}
