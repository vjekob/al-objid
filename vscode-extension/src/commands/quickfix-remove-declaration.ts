import { AppManifest } from "../lib/types";

export async function quickFixRemoveDeclaration(manifest: AppManifest, type: string) {
    manifest.ninja.config.setObjectRanges(type, undefined);
}
