import { RelativePattern, window, workspace } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { AppManifest } from "../lib/types";
import { UI } from "../lib/UI";

export async function selectBCLicense(manifest?: AppManifest) {
    if (!manifest) {
        manifest = await ALWorkspace.selectWorkspaceFolder();
        if (!manifest) {
            return;
        }
    }

    const folderPath: string = manifest.ninja.uri.fsPath;
    const pattern = new RelativePattern(folderPath, "**/*.bclicense");
    const files = await workspace.findFiles(pattern, null);
    if (files.length === 0) {
        UI.license.noLicenseFilesFound(manifest);
        return;
    }

    const picks = files.map(file => `.${file.fsPath.substring(folderPath.length)}`);
    const pick = await window.showQuickPick(picks, { placeHolder: "Select a *.bclicense file..." });
    if (pick) {
        manifest.ninja.config.bcLicense = pick;
    }
}
