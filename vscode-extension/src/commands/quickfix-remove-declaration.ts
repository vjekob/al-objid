import { ALApp } from "../lib/ALApp";

export async function quickFixRemoveDeclaration(app: ALApp, type: string) {
    app.config.setObjectTypeRanges(type, undefined);
}
