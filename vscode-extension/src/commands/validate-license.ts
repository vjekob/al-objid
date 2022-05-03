import { ALWorkspace } from "../lib/ALWorkspace";

export async function validateLicense() {
    const app = await ALWorkspace.selectWorkspaceFolder();
    if (!app) {
        return;
    }

    const license = await app.ninja.config.getLicenseObject();
    if (!license?.isValid) {
        return;
    }

    license.validate();
}
