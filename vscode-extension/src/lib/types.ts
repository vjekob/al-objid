import { Uri } from "vscode";
import { ALApp } from "./ALApp";
import { __ObjIdConfig_obsolete_ } from "./__ObjIdConfig_obsolete_";

export interface ALRange {
    from: number;
    to: number;
}

export interface NinjaALRange extends ALRange {
    description: string;
}

/**
 * Defines app manifest as declared in app.json
 */
export interface __AppManifest_obsolete_ {
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

        /**
         * AL Object ID Ninja configuration (from `.objidconfig` file)
         */
        config: __ObjIdConfig_obsolete_;
    };
}

export interface GitCleanOperationContext {
    apps: ALApp[];
    operation: (manifest: ALApp) => Promise<boolean>;
    getFilesToStage: (manifest: ALApp) => string[];
    learnMore: (manifests: ALApp | ALApp[]) => any;
    getCommitMessage: (manifests: ALApp[]) => string;
}

export interface GitTopLevelPathContext {
    uri: Uri;
    apps: ALApp[];
    branch: string;
}

export interface BackEndAppInfo {
    hash: string;
    encrypt: (value: string) => string | undefined;
    decrypt: (value: string) => string | undefined;
}
