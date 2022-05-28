import * as path from "path";
import { Uri } from "vscode";

interface IconPath {
    dark: Uri;
    light: Uri;
}

export function getIconPath(id: string): IconPath {
    const pathToIcon = path.join(__dirname, `../../../images/${id}`);
    return {
        dark: Uri.file(`${pathToIcon}-dark.svg`),
        light: Uri.file(`${pathToIcon}-light.svg`),
    };
}
