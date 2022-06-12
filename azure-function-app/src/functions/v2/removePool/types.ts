export interface RemovePoolRequest {
    poolId: string;
    accessKey: string;

    /**
     * When this is `false`, then the `_pool` section is removed from the app blob.
     * When this is `true`, then the entire app blob is deleted from the back end.
     */
    deleteBlob: boolean;
}
