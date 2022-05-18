import { ALApp } from "../lib/ALApp";

/**
 * Removes an invalid property from the root of the `.objidconfig` object
 */
export async function quickFixRemoveProperty(app: ALApp, type: string) {
    app.config.removeProperty(type);
}
