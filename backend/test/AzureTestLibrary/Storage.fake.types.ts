import * as azure from "azure-storage";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";

export const mockCreateBlobService = azure.createBlobService as jest.Mock;
export type AzureError = undefined | Error & { statusCode?: number, code?: string };
export type ErrorFirstFunction<T> = (error: AzureError, result: T | undefined, response?: { etag: symbol }) => void;

export interface FakeStorage {
    [key: string]: any;
}

export interface ContentAnalyzer {
    objectIds(objectType: ALObjectType): number[];
    hasChanged(): boolean;
    isAuthorized(): boolean;
}

export abstract class StubBuilder {
    abstract get content(): {};
}

export interface ListResponse {
    entries: any[],
    token: symbol | undefined;
}

export interface CreateBlobOptions {
    accessConditions: {
        EtagMatch: symbol
    }
}

export interface StorageOptions {
    preventDelete?: boolean;
}

export interface IStorageService {
    getBlobToText(__ignore_container__: string, blob: string, callback: ErrorFirstFunction<string>): void;
    createBlockBlobFromText(__ignore_container__: string, blob: string, content: any, options: CreateBlobOptions | undefined, callback: ErrorFirstFunction<void>): void;
    deleteBlob(__ignore_container__: string, blob: string, callback: ErrorFirstFunction<void>): void;
    listBlobsSegmented(__ignore_container__: string, token: symbol | undefined, callback: ErrorFirstFunction<ListResponse>): void;
}
