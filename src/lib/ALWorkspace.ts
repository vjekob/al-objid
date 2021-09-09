import { QuickPickItem, Uri, window, workspace } from "vscode";
import { getManifest } from "./AppManifest";
import { UI } from "./UI";

interface WorkspaceFolderQuickPickItem extends QuickPickItem {
    uri: Uri;
}

type QuickPickResolve = (uri?: Uri) => void;

export class ALWorkspace {
    public static isALWorkspace(uri: Uri): boolean {
        let manifest = getManifest(uri);
        return typeof manifest?.id === "string";
    }

    public static async selectWorkspaceFolder(uri?: Uri): Promise<Uri | undefined> {
        if (uri && this.isALWorkspace(uri)) return workspace.getWorkspaceFolder(uri)!.uri;

        uri = window.activeTextEditor?.document.uri;
        if (uri && this.isALWorkspace(uri)) return workspace.getWorkspaceFolder(uri)!.uri;

        const workspaces = workspace.workspaceFolders?.filter(folder => this.isALWorkspace(folder.uri));
        if (!workspaces) {
            UI.general.showNoWorkspacesOpenInfo();
            return;
        }

        if (workspaces.length === 1) return workspaces[0].uri;

        return new Promise((resolve: QuickPickResolve) => {
            const quickPick = window.createQuickPick<WorkspaceFolderQuickPickItem>();
            quickPick.placeholder = "Select an AL workspace folder..."
            quickPick.items = workspaces.map(w => {
                let manifest = getManifest(w.uri);
                return {
                    label: w.name,
                    detail: `$(folder) ${w.uri.fsPath}`,
                    description: `${manifest!.name} (${manifest!.version})`,
                    uri: w.uri
                }
            });
            quickPick.show();

            let resolved = false;
            let selectedFolder: WorkspaceFolderQuickPickItem | undefined;

            quickPick.onDidChangeSelection(selected => selectedFolder = selected.length ? selected[0] : undefined);
            quickPick.onDidAccept(() => {
                resolved = true;
                resolve(selectedFolder && selectedFolder.uri);
                quickPick.hide();
            });
            quickPick.onDidHide(() => {
                if (!resolved) resolve();
                quickPick.dispose();
            });
        });
    }
}

