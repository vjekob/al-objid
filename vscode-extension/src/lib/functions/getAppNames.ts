import { ALApp } from "../ALApp";

/**
 * Retrieves a properly delimited app names from an ALApp array.
 * @param apps ALApp array to extract names from
 * @returns String containing list of app names properly delimited
 */

export function getAppNames(apps: ALApp[]) {
    switch (apps.length) {
        case 1:
            return apps[0].manifest.name;
        case 2:
            return apps.map(app => app.manifest.name).join(" and ");
        default:
            return `${apps
                .slice(0, apps.length - 1)
                .map(app => app.manifest.name)
                .join(", ")}, and ${apps[apps.length - 1].manifest.name}`;
    }
}
