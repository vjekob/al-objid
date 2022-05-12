import { __AppManifest_obsolete_ } from "../lib/types";

export async function quickFixRemoveDeclaration(manifest: __AppManifest_obsolete_, type: string) {
    manifest.ninja.config.setObjectRanges(type, undefined);
}
