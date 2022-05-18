import { ALApp } from "../lib/ALApp";

/**
 * Removes an invalid object type declaration in `objectRanges` property
 */
export async function quickFixRemoveDeclaration(app: ALApp, type: string) {
    app.config.setObjectTypeRanges(type, undefined);
}
