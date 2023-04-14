import * as path from "path";
import { Uri } from "vscode";

interface IconPath {
    dark: Uri;
    light: Uri;
}

export function getIconPath(id: string): IconPath {
    const pathToIcon = path.join(__dirname, `../../images/${id}`);
    return {
        dark: Uri.file(`${pathToIcon}-dark.svg`),
        light: Uri.file(`${pathToIcon}-light.svg`),
    };
}

export function getSingleIconPath(id: keyof typeof NinjaIconType): Uri {
    const pathToIcon = path.join(__dirname, `../../images/${id}`);
    const uri = Uri.file(`${pathToIcon}.svg`);
    return uri;
}

export enum NinjaIconType {
    "object-ranges",
    "object-ranges-type",
    "physical-range",
    "object-green",
    "object-yellow",
    "object-blue",
    "object-red",
    "range-green",
    "range-yellow",
    "range-blue",
    "range-red",
    "logical-range",
    "object-logical-range",
    "arrow-both",
    "arrow-both-inactive",
    "note",
    "al-app",
    "al-apps",
    "al-app-cloud",
    "al-collision",
    "check",
    "object-collision",
    "al-lost",
    "object-lost",
}

export const NinjaIcon: { [key in keyof typeof NinjaIconType]: IconPath } = {} as any;

for (let key of Object.keys(NinjaIconType)) {
    (NinjaIcon as any)[key] = getIconPath(key);
}
