import { ALWorkspace } from "../lib/ALWorkspace";
import { LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions";
import { UI } from "../lib/UI";

export async function validateLicense() {
    const manifest = await ALWorkspace.selectWorkspaceFolder();
    if (!manifest) {
        return;
    }

    const license = await manifest.ninja.config.getLicenseObject();
    if (!license?.isValid) {
        UI.license.showNoLicenseMessage(manifest).then(result => {
            if (result === LABELS.BUTTON_LEARN_MORE) {
                showDocument("validate-license");
            }
        });
        return;
    }

    license.validate();
}
