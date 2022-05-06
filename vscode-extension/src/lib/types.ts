import { Uri } from "vscode";
import { ObjIdConfig } from "./ObjIdConfig";

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

        /**
         * AL Object ID Ninja configuration (from `.objidconfig` file)
         */
        config: ObjIdConfig;
    };
}

export interface GitCleanOperationContext {
    manifests: AppManifest[];
    operation: (manifest: AppManifest) => Promise<boolean>;
    getFilesToStage: (manifest: AppManifest) => string[];
    learnMore: (manifests: AppManifest | AppManifest[]) => any;
    getCommitMessage: (manifests: AppManifest[]) => string;
}

export interface GitTopLevelPathContext {
    uri: Uri;
    manifests: AppManifest[];
    branch: string;
}

export enum ConfigurationProperty {
    AuthKey = "authKey",
    AppPoolId = "appPoolId",
    BackEndUrl = "backEndUrl",
    BackEndApiKey = "backEndApiKey",
    Ranges = "idRanges",
    ObjectRanges = "objectRanges",
    BcLicense = "bcLicense",
    LicenseReport = "licenseReport",
}
