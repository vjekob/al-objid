import { Uri } from "vscode";

export interface ALRange {
    from: number;
    to: number;
}

export interface NinjaRange extends ALRange {
    shortDescription: string;
    fullDescription: string;
}

/**
 * Defines app manifest as declared in app.json
 */
export interface AppManifest {
    /**
     * **IMPORTANT!** This is not the original `id` from `app.json`. This is a SHA256 hash of that `id`.
     * You can find original `id` in `.ninja.unsafeOriginalId` property of this type.
     */
    id: string;
    name: string;
    version: string;
    idRanges: ALRange[];
    preprocessorSymbols: string[];

    /**
     * Defines additional properties not present in `app.json` but necessary for Ninja
     */
    ninja: {
        /**
         * Original `id` from `app.json`. It's purposefuly hidden away because for most operations
         * the hash should be used instead of original ID.
         */
        unsafeOriginalId: string;

        /**
         * URI of the folder where this app resides (folder that contains `app.json`)
         */
        uri: Uri;

        /**
         * Fully qualified file system path to the `app.json` file
         */
        path: string;
    }
}

export interface GitCleanOperationContext {
    manifests: AppManifest[];
    operation: (manifest: AppManifest) => Promise<boolean>;
    getFilesToStage: (manifest: AppManifest) => string[];
    learnMore: (manifest: AppManifest) => any,
    getCommitMessage: (manifest: AppManifest) => string
}
