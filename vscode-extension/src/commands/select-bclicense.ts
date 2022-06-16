import * as path from "path";
import { RelativePattern, Uri, window, workspace } from "vscode";
import { BCLicense } from "../lib/BCLicense";
import { LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions/showDocument";
import { UI } from "../lib/UI";
import { ALApp } from "../lib/ALApp";
import { WorkspaceManager } from "../features/WorkspaceManager";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

export async function selectBCLicense(appOrUri?: ALApp | Uri) {
    if (!appOrUri) {
        appOrUri = await WorkspaceManager.instance.selectWorkspaceFolder();
        if (!appOrUri) {
            return;
        }
    }

    const licensePath =
        appOrUri instanceof Uri ? selectLicenseFromUri(appOrUri) : await selectLicenseFromManifest(appOrUri);
    if (!licensePath) {
        return;
    }

    Telemetry.instance.logCommand(NinjaCommand.SelectBCLicense);

    const folderPath = workspace.getWorkspaceFolder(appOrUri instanceof Uri ? appOrUri : appOrUri.uri)!.uri.fsPath;

    const bcLicense = new BCLicense(path.join(folderPath, licensePath));
    if (!bcLicense.isValid) {
        if ((await UI.license.showInvalidLicenseError()) === LABELS.BUTTON_LEARN_MORE) {
            showDocument("validate-license");
        }
        return;
    }

    const app = WorkspaceManager.instance.getALAppFromUri(bcLicense.uri)!;
    app.config.bcLicense = licensePath;
}

function selectLicenseFromUri(uri: Uri): string | undefined {
    const app = WorkspaceManager.instance.getALAppFromUri(uri);
    if (app) {
        const folder = workspace.getWorkspaceFolder(uri)!;
        return `.${uri.fsPath.substring(folder.uri.fsPath.length)}`;
    }
}

async function selectLicenseFromManifest(app: ALApp): Promise<string | undefined> {
    const folderPath: string = app.uri.fsPath;
    const pattern = new RelativePattern(folderPath, "**/*.bclicense");
    const files = await workspace.findFiles(pattern, null);
    if (files.length === 0) {
        UI.license.noLicenseFilesFound(app);
        return;
    }

    const picks = files.map(file => `.${file.fsPath.substring(folderPath.length)}`);
    return window.showQuickPick(picks, { placeHolder: "Select a *.bclicense file..." });
}
