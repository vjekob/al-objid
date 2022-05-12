import { Uri } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { BCLicense } from "../lib/BCLicense";
import { LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions";
import { UI } from "../lib/UI";

export async function validateLicense(uri: any) {
    const license = await (uri ? getExplicitLicense(uri) : getDefaultLicense());

    if (license instanceof BCLicense) {
        license.validate();
        return;
    }

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
    const manifest = await ALWorkspace.selectWorkspaceFolder();
    if (!manifest) {
        return;
    }

    const license = await manifest.ninja.config.getLicenseObject();
    if (!license?.isValid) {
        return UI.license.showNoLicenseMessage(manifest);
    }

    return license;
}
