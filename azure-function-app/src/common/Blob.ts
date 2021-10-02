import * as azure from "azure-storage";

const connectionString = process.env.AzureWebJobsStorage;
const STORAGE_CONTAINER = process.env.BlobContainer;

/**
 * Performs in-memory update of the data read from blob. If this method returns the same object it received (checked by strict
 * equality) then no update of the underlying blob will be performed. If it returns a different object, then an attempt at updating
 * the underlying blob will be made.
 * 
 * The principle of this method is that of Redux reducers: if a reducer returns the same state (by reference) that it received, no
 * update of the underlying store is performed; if it returns a different state (by reference), then Redux performs the update of
 * the store.
 * 
 * @param data Data to update.
 * @param attempts Number of attempts at performing this update that have already been made.
 * @returns Updated data, or the same object received as `data` parameter if no update should be made.
 */
export type UpdateCallback<T> = (data: T, attempts: number) => T;

export const TIMEOUT_TOKEN = Symbol("TIMEOUT_TOKEN");

export class Blob<T> {
    private _service: azure.BlobService;
    private _blob: string;
    private _container: string;
    private _leaseId?: string;

    constructor(blob: string, container?: string) {
        this._service = azure.createBlobService(connectionString);
        this._blob = blob;
        this._container = container || STORAGE_CONTAINER;
    }

    private async getProperties(): Promise<azure.BlobService.BlobResult> {
        return new Promise((fulfill) => {
            this._service.getBlobProperties(this._container, this._blob, (error, result) => {
                fulfill(result);
            });
        });
    }

    async exists(): Promise<boolean> {
        const props = await this.getProperties();
        return !!(props && props.creationTime);
    }

    async lock(): Promise<boolean> {
        if (this._leaseId) {
            return false;
        }
        return new Promise((fulfill) => {
            this._service.acquireLease(this._container, this._blob, { leaseDuration: 15 }, (error, result) => {
                if (error) {
                    fulfill(false);
                    return;
                }
                this._leaseId = result.id;
                fulfill(true);
            });
        });
    }

    async unlock(): Promise<boolean> {
        if (!this._leaseId) {
            return false;
        }
        return new Promise((fulfill) => {
            this._service.releaseLease(this._container, this._blob, this._leaseId, (error, result) => {
                if (error) {
                    fulfill(false);
                    return;
                }
                this._leaseId = undefined;
                fulfill(true);
            });
        });
    }

    async read(ignoreError: boolean = false): Promise<T | null> {
        return new Promise((fulfill) => {
            this._service.getBlobToText(this._container, this._blob, (error, result) => {
                error ? fulfill(ignoreError ? {} as T : null) : fulfill(JSON.parse(result) as T);
            });
        });
    }

    async delete(): Promise<boolean> {
        let options: azure.BlobService.DeleteBlobRequestOptions = {};
        if (this._leaseId) {
            options.leaseId = this._leaseId;
        }
        return new Promise((fulfill) => {
            this._service.deleteBlob(this._container, this._blob, options, (error, result) => {
                fulfill(!error);
            });
        });
    }

    async readAll(token?: any): Promise<any> {
        return new Promise((fulfill) => {
            this._service.listBlobsSegmented(this._container, token, (error, result) => {
                error ? fulfill(null) : fulfill(result)
            });
        });
    }

    /**
     * Performs an optimistic update of the blob. It first reads the blob, then calls the `update` callback thet performs any data
     * updates in-memory, and then returns the new object. Then, this method attempts to updated the blob it read. If the blob has
     * been updated in the meantime, it re-attempts the same process.
     * 
     * @param update Method that receives the previously stored data as input parameter, and returns new data as output. If the same 
     * @param timeout Timeout to wait for an attempt of reading
     * @returns Updated data
     */
    optimisticUpdate(update: UpdateCallback<T>, timeout = 2500): Promise<T | null> {
        const service = this._service;
        const blob = this._blob;
        const container = this._container;

        return new Promise((fulfill, reject) => {
            let attempt = 0;
            let updatedContent: T | null = null;
            let fulfilled = false;
            let timedOut = false;
            let timeoutHandle = null;

            function readBlob() {
                if (timedOut) return;

                service.getBlobToText(container, blob, (error, result, response) => {
                    let notFound = false;
                    if (error) {
                        if ((error as any).statusCode !== 404) {
                            setTimeout(() => readBlob(), 10);
                            return;
                        }
                        notFound = true;
                    }

                    const content = notFound ? null : JSON.parse(result);
                    try {
                        updatedContent = update(content, attempt++);
                    } catch (error) {
                        reject(error);
                        return;
                    }

                    if (updatedContent === content) {
                        fulfill(content);
                        return;
                    }

                    updateBlob(updatedContent, response && response.etag);
                });
            }

            function updateBlob(content: T, etag: string) {
                if (timedOut) return;

                service.createBlockBlobFromText(
                    container,
                    blob,
                    JSON.stringify(content),
                    etag ? { accessConditions: { EtagMatch: etag } } : undefined,
                    (error) => {
                        if (error) {
                            setTimeout(() => readBlob(), 10);
                            return;
                        }

                        clearTimeout(timeoutHandle);
                        fulfilled = true;
                        fulfill(updatedContent);
                    }
                );
            }

            timeoutHandle = setTimeout(() => {
                if (fulfilled) return;

                timedOut = true;
                reject(TIMEOUT_TOKEN);
            }, timeout);

            readBlob();
        });
    }
}
