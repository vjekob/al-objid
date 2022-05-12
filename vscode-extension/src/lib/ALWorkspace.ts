import { Uri, window, workspace, WorkspaceFolder } from "vscode";
import { getManifest, getCachedManifestFromUri } from "./__AppManifest_obsolete_";
import { QuickPickWrapper } from "./QuickPickWrapper";
import { __AppManifest_obsolete_ } from "./types";
import { UI } from "./UI";

export class ALWorkspace {
    public static isALWorkspace(uri: Uri): boolean {
        let manifest = getManifest(uri);
        return typeof manifest?.id === "string";
    }

    public static getALFolders(): WorkspaceFolder[] | undefined {
        return workspace.workspaceFolders?.filter(folder => this.isALWorkspace(folder.uri));
    }

    private static async pickFolderOrFolders(
        multi: boolean,
        operationDescription?: string
    ): Promise<__AppManifest_obsolete_[] | __AppManifest_obsolete_ | undefined> {
        const workspaces = this.getALFolders();
        if (!workspaces || workspaces.length === 0) {
            UI.general.showNoWorkspacesOpenInfo();
            return;
        }

        if (workspaces.length === 1) {
            const manifest = getCachedManifestFromUri(workspaces[0].uri)!;
            return multi ? [manifest] : manifest;
        }

        let quickPick = new QuickPickWrapper<__AppManifest_obsolete_>(
            workspaces.map(w => {
                let manifest = getCachedManifestFromUri(w.uri);
                return {
                    label: w.name,
                    detail: `$(folder) ${w.uri.fsPath}`,
                    description: `${manifest!.name} (${manifest!.version})`,
                    data: manifest,
                };
            })
        );
        quickPick.placeholder = multi
            ? `Choose AL workspace folders${
                  operationDescription ? ` ${operationDescription}` : ""
              }...`
            : `Select an AL workspace folder${
                  operationDescription ? ` ${operationDescription}` : ""
              }...`;
        quickPick.ignoreFocusOut = multi;

        let result = await (multi ? quickPick.pickMany() : quickPick.pickOne());
        if (!result) return undefined;
        return result;
    }

    public static pickFolder(
        operationDescription?: string
    ): Promise<__AppManifest_obsolete_ | undefined> {
        return this.pickFolderOrFolders(false, operationDescription) as Promise<
            __AppManifest_obsolete_ | undefined
        >;
    }

    public static pickFolders(
        operationDescription?: string
    ): Promise<__AppManifest_obsolete_[] | undefined> {
        return this.pickFolderOrFolders(true, operationDescription) as Promise<
            __AppManifest_obsolete_[] | undefined
        >;
    }

    public static async selectWorkspaceFolder(
        uri?: Uri
    ): Promise<__AppManifest_obsolete_ | undefined> {
        if (uri && this.isALWorkspace(uri)) {
            return getCachedManifestFromUri(uri);
        }

        uri = window.activeTextEditor?.document.uri;
        if (uri && this.isALWorkspace(uri)) {
            return getCachedManifestFromUri(uri);
        }

        return this.pickFolder();
    }
}
