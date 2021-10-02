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
    private _nextLeaseId: number = 0;
    private _nextETag: number = 0;
    private _leased: { [key: string]: string } = {};
    private _timeouts: { [key: string]: NodeJS.Timeout } = {};

    private getETag(blob: string): symbol {
        if (!this._etags[blob]) {
            this.setETag(blob);
        }
        return this._etags[blob];
    }

    private setETag(blob: string): void {
        this._etags[blob] = Symbol(`${blob}.${this._nextETag++}`);
    }

    constructor(content: StubBuilder | FakeStorage, options?: StorageOptions) {
        this._options = options;
        if (content instanceof StubBuilder) {
            this._content = content.content;
        } else {
            this._content = content;
        }
    }

    acquireLease(_: string, blob: string, options: any, callback: ErrorFirstFunction<any>) {
        setTimeout(() => {
            if (!this._content[blob]) {
                let error = {
                    name: "StorageError",
                    message: "The specified blob does not exist.",
                    code: "BlobNotFound",
                    statusCode: 404,
                };
                setTimeout(() => callback(error, null));
                return;
            }

            if (this._leased[blob]) {
                let error = {
                    name: "StorageError",
                    message: "There is already a lease present.",
                    code: "LeaseAlreadyPresent",
                    statusCode: 409,
                };
                setTimeout(() => callback(error, null));
                return;
            }

            let id = `${this._nextLeaseId++}`;
            this._leased[blob] = id;

            // Lease timeout
            this._timeouts[blob] = setTimeout(() => {
                if (this._leased[blob] === id) {
                    delete this._timeouts[blob];
                    delete this._leased[blob];
                }
            }, (options && options.leaseDuration || 60) * 1000);

            setTimeout(() => callback(null, { id }))
        });
    }

    getBlobProperties(_: string, blob: string, callback: ErrorFirstFunction<any>) {
        setTimeout(() => {
            if (this._content[blob]) {
                setTimeout(() => callback(null, { creationTime: Date.now().toString() }));
                return;
            }
            let error: AzureError = {
                name: "StorageError",
                message: "The specified blob does not exist.",
                code: "BlobNotFound",
                statusCode: 404,
            };
            setTimeout(() => callback(error, null));
        });
    }

    getBlobToText(_: string, blob: string, callback: ErrorFirstFunction<string>): void {
        setTimeout(() => {
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
            setTimeout(() => callback(error, content, { etag }));
        });
    }

    createBlockBlobFromText(_: string, blob: string, content: any, options: CreateBlobOptions | undefined, callback: ErrorFirstFunction<void>): void {
        setTimeout(() => {
            if (options) {
                if (this._etags[blob] !== options.accessConditions.EtagMatch) {
                    setTimeout(() => callback({ statusCode: 412, code: "", name: "StorageError", message: "" }));
                    return;
                }
            }
            this._content[blob] = JSON.parse(content);
            this.setETag(blob);
            setTimeout(() => callback(undefined));
        });
    }

    deleteBlob(_: string, blob: string, options: any, callback: ErrorFirstFunction<void>) {
        setTimeout(() => {
            let doDelete = !(this._options && this._options.preventDelete);
            if (doDelete) {
                if (this._leased[blob] && (!options || options.leaseId !== this._leased[blob])) {
                    let error = {
                        name: "StorageError",
                        message: "The lease ID specified did not match the lease ID for the blob.",
                        code: "LeaseIdMismatchWithBlobOperation",
                        statusCode: 409,
                    };
                    setTimeout(() => callback(error));
                    return;
                }
                if (!this._content[blob]) {
                    let error = {
                        name: "StorageError",
                        message: "The specified blob does not exist.",
                        code: "BlobNotFound",
                        statusCode: 404,
                    };
                    setTimeout(() => callback(error));
                    return;
                }
                delete this._content[blob];
                delete this._etags[blob];

                if (this._leased[blob]) {
                    clearTimeout(this._timeouts[blob]);
                    delete this._timeouts[blob];
                    delete this._leased[blob];
                }
            }
            setTimeout(() => callback(doDelete ? undefined : new Error("Cannot delete")));
        });
    }

    listBlobsSegmented(_: string, token: symbol | undefined, callback: ErrorFirstFunction<ListResponse>) {
        setTimeout(() => {
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

            setTimeout(() => callback(undefined, response));
        });
    }

    releaseLease(_: string, blob: string, leaseId: string, callback: ErrorFirstFunction<any>) {
        setTimeout(() => {
            if (!this._content[blob]) {
                let error = {
                    name: "StorageError",
                    message: "The specified blob does not exist.",
                    code: "BlobNotFound",
                    statusCode: 404,
                };
                setTimeout(() => callback(error, null));
                return;
            }

            if (this._leased[blob] && this._leased[blob] !== leaseId) {
                let error = {
                    name: "StorageError",
                    message: "The lease ID specified did not match the lease ID for the blob.",
                    code: "LeaseIdMismatchWithBlobOperation",
                    statusCode: 409,
                };
                setTimeout(() => callback(error, null));
                return;
            }

            clearTimeout(this._timeouts[blob]);
            delete this._timeouts[blob];
            delete this._leased[blob];
            setTimeout(() => callback(null, null))
        });
    }
}

export function useStorage(storage: FakeStorage, options?: StorageOptions) {
    const fakeService = new SimpleStorage(storage, options);
    mockCreateBlobService.mockImplementation(() => fakeService);
}
