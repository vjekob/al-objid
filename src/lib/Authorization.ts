import { Uri, workspace } from "vscode";
import path = require("path");
import * as fs from "fs";
import stripJsonComments from "./stripJsonComments";

export interface AuthorizationKey {
    key: string;
}

const PLACEHOLDER = "<PLACEHOLDER>";

const AUTH_FILE_CONTENT = `
{
    // This is your Vjeko.com AL Object ID Ninja authorization key. Keep this file safe, do not delete it.
    "key": "${PLACEHOLDER}"
}
`;

export class Authorization {
    static read(uri: Uri): AuthorizationKey | null {
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

    static write(uri: Uri, key: string) {
        const appPath = path.join(uri.fsPath, ".objidauth");
        fs.writeFileSync(appPath, AUTH_FILE_CONTENT.replace(PLACEHOLDER, key));
    }

    static delete(uri: Uri) {
        const appPath = path.join(uri.fsPath, ".objidauth");
        fs.unlinkSync(appPath);
    }
}
