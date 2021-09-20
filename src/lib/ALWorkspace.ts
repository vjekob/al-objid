import { Uri, window, workspace, WorkspaceFolder } from "vscode";
import { getManifest } from "./AppManifest";
import { QuickPickWrapper } from "./QuickPickWrapper";
import { UI } from "./UI";

export class ALWorkspace {
    public static isALWorkspace(uri: Uri): boolean {
        let manifest = getManifest(uri);
        return typeof manifest?.id === "string";
    }

    public static getALFolders(): WorkspaceFolder[] | undefined {
        return workspace.workspaceFolders?.filter(folder => this.isALWorkspace(folder.uri))
    }

    public static async pickFolder(multi: boolean): Promise<Uri[] | Uri | undefined> {
        const workspaces = this.getALFolders();
        if (!workspaces || workspaces.length === 0) {
            UI.general.showNoWorkspacesOpenInfo();
            return;
        }

        if (workspaces.length === 1) return workspaces[0].uri;

        let quickPick = new QuickPickWrapper<Uri>(workspaces.map(w => {
            let manifest = getManifest(w.uri);
            return {
                label: w.name,
                detail: `$(folder) ${w.uri.fsPath}`,
                description: `${manifest!.name} (${manifest!.version})`,
                data: w.uri
            }
        }));
        quickPick.placeholder = multi
            ? "Choose AL workspace folders..."
            : "Select an AL workspace folder...";
        quickPick.ignoreFocusOut = multi;

        let result = await (multi ? quickPick.pickMany() : quickPick.pickOne());
        if (!result) return undefined;
        return multi
            ? result as Uri[]
            : result as Uri;
    }

    public static async selectWorkspaceFolder(uri?: Uri): Promise<Uri | undefined> {
        if (uri && this.isALWorkspace(uri)) return workspace.getWorkspaceFolder(uri)!.uri;

        uri = window.activeTextEditor?.document.uri;
        if (uri && this.isALWorkspace(uri)) return workspace.getWorkspaceFolder(uri)!.uri;

        return this.pickFolder(false) as Promise<Uri | undefined>;
    }
}

