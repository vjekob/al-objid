import { Uri } from "vscode";
import { BCLicense } from "../lib/BCLicense";
import { LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions/showDocument";
import { UI } from "../lib/UI";
import { WorkspaceManager } from "../features/WorkspaceManager";
import { Telemetry } from "../lib/Telemetry";
import { NinjaCommand } from "./commands";

export async function validateLicense(uri: any) {
    const license = await (uri ? getExplicitLicense(uri) : getDefaultLicense());

    if (license instanceof BCLicense) {
        license.validate();
        return;
    }

    Telemetry.instance.logCommand(NinjaCommand.ValidateLicense);

    if (license === LABELS.BUTTON_LEARN_MORE) {
        showDocument("validate-license");
    }
}

async function getExplicitLicense(uri: Uri): Promise<BCLicense | string | undefined> {
    const license = new BCLicense(uri.fsPath);
    if (!license.isValid) {
        return await UI.license.showInvalidLicenseError();
    }

    return license;
}

async function getDefaultLicense(): Promise<BCLicense | string | undefined> {
    const app = await WorkspaceManager.instance.selectWorkspaceFolder();
    if (!app) {
        return;
    }

    const license = await app.config.getLicenseObject();
    if (!license?.isValid) {
        return UI.license.showNoLicenseMessage(app);
    }

    return license;
}
