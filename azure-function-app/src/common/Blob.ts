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
    private service: azure.BlobService;
    private blob: string;

    constructor(blob: string) {
        this.service = azure.createBlobService(connectionString);
        this.blob = blob;
    }

    async read(ignoreError: boolean = false): Promise<T | null> {
        return new Promise((fulfill) => {
            this.service.getBlobToText(STORAGE_CONTAINER, this.blob, (error, result) => {
                error ? fulfill(ignoreError ? {} as T : null) : fulfill(JSON.parse(result) as T);
            });
        });
    }

    async delete(): Promise<boolean> {
        return new Promise((fulfill) => {
            this.service.deleteBlob(STORAGE_CONTAINER, this.blob, (error, result) => {
                fulfill(!error);
            });
        });
    }

    async readAll(token?: any): Promise<any> {
        return new Promise((fulfill) => {
            this.service.listBlobsSegmented(STORAGE_CONTAINER, token, (error, result) => {
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
        var service = this.service;
        var blob = this.blob;

        return new Promise((fulfill, reject) => {
            var attempt = 0;
            var updatedContent: T | null = null;
            var fulfilled = false;
            var timedOut = false;
            var timeoutHandle = null;

            function readBlob() {
                if (timedOut) return;

                service.getBlobToText(STORAGE_CONTAINER, blob, (error, result, response) => {
                    var notFound = false;
                    if (error) {
                        if ((error as any).statusCode !== 404) {
                            setTimeout(() => readBlob(), 10);
                            return;
                        }
                        notFound = true;
                    }

                    var content = notFound ? null : JSON.parse(result);
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
                    STORAGE_CONTAINER,
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