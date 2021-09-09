import { Uri, workspace } from "vscode";
import path = require("path");
import * as fs from "fs";
import stripJsonComments from "./stripJsonComments";

export interface AuthorizationKey {
    key: string;
}

export function getAuthorization(uri: Uri): AuthorizationKey | null {
    const folder = workspace.getWorkspaceFolder(uri);
    if (!folder) return null;

    const authPath = path.join(folder.uri.fsPath, ".objidauth");
    try {
        const data = fs.readFileSync(authPath).toString();
        return JSON.parse(stripJsonComments(data)) as AuthorizationKey;
    }
    catch {
        return null;
    }
}
