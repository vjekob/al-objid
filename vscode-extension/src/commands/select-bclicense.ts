import * as path from "path";
import { RelativePattern, Uri, window, workspace } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { BCLicense } from "../lib/BCLicense";
import { LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions";
import { AppManifest } from "../lib/types";
import { UI } from "../lib/UI";

export async function selectBCLicense(manifestOrUri?: AppManifest | Uri) {
    if (!manifestOrUri) {
        manifestOrUri = await ALWorkspace.selectWorkspaceFolder();
        if (!manifestOrUri) {
            return;
        }
    }

    const licensePath =
        manifestOrUri instanceof Uri
            ? selectLicenseFromUri(manifestOrUri)
            : await selectLicenseFromManifest(manifestOrUri);
    if (!licensePath) {
        return;
    }

    const folderPath = workspace.getWorkspaceFolder(
        manifestOrUri instanceof Uri ? manifestOrUri : manifestOrUri.ninja.uri
    )!.uri.fsPath;

    const bcLicense = new BCLicense(path.join(folderPath, licensePath));
    if (!bcLicense.isValid) {
        if ((await UI.license.showInvalidLicenseError()) === LABELS.BUTTON_LEARN_MORE) {
            showDocument("validate-license");
        }
        return;
    }

    const manifest = getManifest(bcLicense.uri)!;
    manifest.ninja.config.bcLicense = licensePath;
}

function selectLicenseFromUri(uri: Uri): string | undefined {
    const manifest = getManifest(uri);
    if (manifest) {
        const folder = workspace.getWorkspaceFolder(uri)!;
        return `.${uri.fsPath.substring(folder.uri.fsPath.length)}`;
    }
}

async function selectLicenseFromManifest(manifest: AppManifest): Promise<string | undefined> {
    const folderPath: string = manifest.ninja.uri.fsPath;
    const pattern = new RelativePattern(folderPath, "**/*.bclicense");
    const files = await workspace.findFiles(pattern, null);
    if (files.length === 0) {
        UI.license.noLicenseFilesFound(manifest);
        return;
    }

    const picks = files.map(file => `.${file.fsPath.substring(folderPath.length)}`);
    return window.showQuickPick(picks, { placeHolder: "Select a *.bclicense file..." });
}
