import {
    AzureError,
    CreateBlobOptions,
    ErrorFirstFunction,
    FakeStorage,
    IStorageService,
    ListResponse,
    mockCreateBlobService,
    StorageOptions,
    StubBuilder
} from "./Storage.fake.types";

export class SimpleStorage implements IStorageService {
    private _content: { [key: string]: any } = {};
    private _etags: { [key: string]: symbol } = {};
    private _tokens: { [key: symbol]: number } = {};
    private _options?: StorageOptions;

    private getETag(blob: string): symbol {
        if (!this._etags[blob]) {
            this.setETag(blob);
        }
        return this._etags[blob];
    }

    private setETag(blob: string): void {
        this._etags[blob] = Symbol(`${blob}.${Date.now()}`);
    }

    constructor(content: StubBuilder | FakeStorage, options?: StorageOptions) {
        this._options = options;
        if (content instanceof StubBuilder) {
            this._content = content.content;
        } else {
            this._content = content;
        }
    }

    getBlobToText(_: string, blob: string, callback: ErrorFirstFunction<string>): void {
        const etag = this.getETag(blob);
        let error: AzureError = undefined;
        let content: string | undefined = undefined;
        if (this._content[blob]) {
            content = JSON.stringify(this._content[blob]);
        } else {
            error = {
                name: "StorageError",
                message: "The specified blob does not exist.",
                code: "BlobNotFound",
                statusCode: 404,
            };
        }
        callback(error, content, { etag });
    }

    createBlockBlobFromText(_: string, blob: string, content: any, options: CreateBlobOptions | undefined, callback: ErrorFirstFunction<void>): void {
        if (options) {
            if (this._etags[blob] !== options.accessConditions.EtagMatch) {
                callback({ statusCode: 412, code: "", name: "StorageError", message: "" });
                return;
            }
        }
        this._content[blob] = JSON.parse(content);
        this.setETag(blob);
        callback(undefined);
    }

    deleteBlob(_: string, blob: string, callback: ErrorFirstFunction<void>) {
        let doDelete = !(this._options && this._options.preventDelete);
        if (doDelete) {
            delete this._content[blob];
            delete this._etags[blob];
        }
        callback(doDelete ? undefined : new Error("Cannot delete"));
    }

    listBlobsSegmented(_: string, token: symbol | undefined, callback: ErrorFirstFunction<ListResponse>) {
        if (!token) {
            token = Symbol();
        }

        const MAX = 2;
        let start = this._tokens[token] || 0;
        let blobs = Object.keys(this._content).splice(start, MAX);
        if (blobs.length < MAX) {
            delete this._tokens[token];
            token = undefined;
        } else {
            this._tokens[token] = start + MAX;
        }

        let response: ListResponse = {
            entries: blobs.map(blob => ({
                blobType: "__fake__",
                container: "__fake__",
                contentLength: "0",
                creationTime: new Date().toString(),
                etag: this.getETag(blob),
                lastModified: new Date().toString(),
                name: blob,
                requestId: Date.now().toString(),
            })),
            token
        };

        callback(undefined, response);
    }
}

export function useStorage(storage: FakeStorage, options?: StorageOptions) {
    mockCreateBlobService.mockImplementation(() => new SimpleStorage(storage, options));
}
