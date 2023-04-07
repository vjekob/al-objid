import * as fs from "fs";
import { Uri, env, window } from "vscode";
import { ConsumptionCache } from "../features/ConsumptionCache";
import { WorkspaceManager } from "../features/WorkspaceManager";
import { Telemetry } from "../lib/Telemetry";
import { ALObjectType } from "../lib/types/ALObjectType";
import { NinjaCommand } from "./commands";
import { ConsumptionData } from "../lib/types/ConsumptionData";
import { AppCommandContext } from "./contexts/AppCommandContext";
import { ALRange } from "../lib/types/ALRange";
import { PropertyBag } from "../lib/types/PropertyBag";
import { NinjaALRange } from "../lib/types/NinjaALRange";
import { ALApp } from "../lib/ALApp";

interface ConsumptionRange {
    from: number;
    to: number;
}

type ConsumptionEntry = ConsumptionRange;

interface ObjectConsumption {
    type: ALObjectType;
    consumption: ConsumptionEntry[];
}

interface ExtendedConsumption extends ObjectConsumption {
    consumed: number;
    total: number;
}

enum ReportFormat {
    JSON = "JSON",
    Text = "Text",
    Markdown = "Markdown",
    CSV = "CSV",
    XML = "XML",
}

const FileFormats = {
    [ReportFormat.JSON]: "json",
    [ReportFormat.Text]: "txt",
    [ReportFormat.Markdown]: "md",
    [ReportFormat.CSV]: "csv",
    [ReportFormat.XML]: "xml",
};

function returnReportInFormat(report: ObjectConsumption[], format: ReportFormat, app: ALApp): string {
    switch (format) {
        case ReportFormat.JSON:
            return consumptionToJson(report, app);

        case ReportFormat.Text:
            return consumptionToText(report, app);

        case ReportFormat.Markdown:
            return consumptionToMarkdown(report, app);

        case ReportFormat.CSV:
            return consumptionToCSV(report, app);

        case ReportFormat.XML:
            return consumptionToXML(report, app);
    }
}

function getObjectTypeCount(objectType: ALObjectType, app: ALApp): number {
    let ranges = app.manifest.idRanges;
    const objectRanges = app.config.objectRanges;

    if (objectRanges && objectRanges[objectType]) {
        ranges = objectRanges[objectType];
    }

    return ranges.reduce((acc, range) => acc + range.to - range.from + 1, 0) || 0;
}

function consumptionRangesToText(ranges: ConsumptionRange[]): [string, number] {
    let consumed = 0;
    let text = ranges
        .map(entry => {
            if (entry.from === entry.to) {
                consumed += 1;
                return `${entry.from}`;
            } else {
                consumed += entry.to - entry.from + 1;
                return `${entry.from}-${entry.to}`;
            }
        })
        .join(", ");
    return [text, consumed];
}

function consumptionToXML(consumption: ObjectConsumption[], app: ALApp): string {
    let text = `<?xml version="1.0" encoding="UTF-8"?><consumptions>`;
    for (let object of consumption) {
        let consumed = 0;
        let ids = "";
        for (let entry of object.consumption) {
            ids += `<ids from="${entry.from}" to="${entry.to}" />`;
            consumed += entry.to - entry.from + 1;
        }
        text += `<objects type="${object.type}" consumed="${consumed}" total="${getObjectTypeCount(
            object.type,
            app
        )}">`;
        text += ids;
        text += "</objects>";
    }
    text += "</consumptions>";
    return text;
}

function consumptionToCSV(consumption: ObjectConsumption[], app: ALApp): string {
    let separatorSpecification = "SEP=,\n";
    let text = separatorSpecification + "Object Type,Consumption,Consumed,Total\n";
    for (let object of consumption) {
        let [consTxt, consumed] = consumptionRangesToText(object.consumption);
        text += `${object.type},${consTxt.includes(", ") ? `"${consTxt}"` : consTxt},${consumed},${getObjectTypeCount(
            object.type,
            app
        )}\n`;
    }
    return text;
}

function consumptionToMarkdown(consumption: ObjectConsumption[], app: ALApp): string {
    const OBJECT_TYPE = "Object Type";
    const CONSUMPTION = "Consumption";
    const CONSUMED = "Consumed";
    const TOTAL = "Total";

    const consumptions: [string, string, string, string][] = [];

    for (let object of consumption) {
        let [consTxt, consumed] = consumptionRangesToText(object.consumption);
        consumptions.push([object.type, consTxt, consumed.toString(), getObjectTypeCount(object.type, app).toString()]);
    }

    const maxTypeLength = Math.max(
        OBJECT_TYPE.length,
        consumptions.reduce((max, [type]) => Math.max(max, type.length), 0)
    );
    const maxConsLength = Math.max(
        CONSUMPTION.length,
        consumptions.reduce((max, [, cons]) => Math.max(max, cons.length), 0)
    );
    const maxConsumedLength = Math.max(
        CONSUMED.length,
        consumptions.reduce((max, [, , consumed]) => Math.max(max, consumed.length), 0)
    );
    const maxTotalLength = Math.max(
        TOTAL.length,
        consumptions.reduce((max, [, , , total]) => Math.max(max, total.length), 0)
    );
    const body = consumptions
        .map(([type, cons, consumed, total]) => {
            const typePadding = " ".repeat(maxTypeLength - type.length);
            const consPadding = " ".repeat(maxConsLength - cons.length);
            const consumedPadding = " ".repeat(maxConsumedLength - consumed.length);
            const totalPadding = " ".repeat(maxTotalLength - total.length);
            return `| ${type}${typePadding} | ${cons}${consPadding} | ${consumed}${consumedPadding} | ${total}${totalPadding} |`;
        })
        .join("\n");

    const typePadding = " ".repeat(maxTypeLength - OBJECT_TYPE.length);
    const consPadding = " ".repeat(maxConsLength - CONSUMPTION.length);
    const consumedPadding = " ".repeat(maxConsumedLength - CONSUMED.length);
    const totalPadding = " ".repeat(maxTotalLength - TOTAL.length);

    const header = `| ${OBJECT_TYPE}${typePadding} | ${CONSUMPTION}${consPadding} | ${CONSUMED}${consumedPadding} | ${TOTAL}${totalPadding} |\n`;
    let divider = `| ${"-".repeat(maxTypeLength)} | ${"-".repeat(maxConsLength)} | ${"-".repeat(
        maxConsumedLength
    )} | ${"-".repeat(maxTotalLength)} |\n`;
    return header + divider + body + "\n";
}

function consumptionToText(consumption: ObjectConsumption[], app: ALApp): string {
    let text = "";
    for (let object of consumption) {
        let [consTxt, consumed] = consumptionRangesToText(object.consumption);
        text += `${object.type}: ${consTxt} (${consumed} of ${getObjectTypeCount(object.type, app)})\n`;
    }
    return text;
}

function consumptionToJson(consumption: ObjectConsumption[], app: ALApp): string {
    const extendedConsumption: ExtendedConsumption[] = [];

    for (let object of consumption) {
        let [, consumed] = consumptionRangesToText(object.consumption);
        extendedConsumption.push({ ...object, consumed, total: getObjectTypeCount(object.type, app) });
    }

    return JSON.stringify(extendedConsumption, null, 2);
}

function generateConsumptionReport(consumption: ConsumptionData): ObjectConsumption[] {
    const report: ObjectConsumption[] = [];
    for (let key in consumption) {
        const objectType = key as ALObjectType;
        const entries: ConsumptionEntry[] = [];

        let from: number | undefined, to: number | undefined;
        for (let id of consumption[objectType]) {
            if (from === undefined) {
                from = id;
            } else {
                switch (true) {
                    case to === undefined:
                        if (id === from + 1) {
                            to = id;
                        } else {
                            entries.push({ from, to: from });
                            from = id;
                        }
                        break;

                    case id === to! + 1:
                        to = id;
                        break;

                    case id > to! + 1:
                        if (from === to) {
                            entries.push({ from, to: from });
                        } else {
                            entries.push({ from, to: to! });
                        }
                        from = id;
                        to = undefined;
                        break;
                }
            }
        }
        if (from) {
            entries.push({ from, to: from === to || to === undefined ? from : to });
        }
        report.push({ type: objectType, consumption: entries });
    }
    return report;
}

function fileUriToReportFormat(uri: Uri): ReportFormat | undefined {
    const ext = uri.fsPath.split(".").pop();
    for (let format of Object.values(ReportFormat)) {
        if (FileFormats[format] === ext) {
            return format;
        }
    }
}

async function processReport(report: ObjectConsumption[], app: ALApp): Promise<void> {
    const saveFilters: { [key: string]: string[] } = {};

    for (let fileFormat of Object.values(ReportFormat)) {
        saveFilters[fileFormat] = [FileFormats[fileFormat]];
    }

    const action = await window.showQuickPick(["Copy to clipboard", "Save to a file"], {
        placeHolder: "Select action",
        ignoreFocusOut: true,
    });
    switch (action) {
        case "Copy to clipboard":
            const format = (await window.showQuickPick(Object.keys(ReportFormat), {
                placeHolder: "Select format",
                ignoreFocusOut: true,
            })) as ReportFormat;
            if (!format) {
                return;
            }

            await env.clipboard.writeText(returnReportInFormat(report, format, app));
            break;

        case "Save to a file":
            const file = await window.showSaveDialog({
                saveLabel: "Save",
                filters: saveFilters,
            });
            if (!file) {
                return;
            }
            fs.writeFileSync(file.fsPath, returnReportInFormat(report, fileUriToReportFormat(file)!, app), {
                encoding: "utf8",
            });
            break;
    }
}

export async function reportConsumption(context?: AppCommandContext) {
    Telemetry.instance.logCommand(NinjaCommand.ReportConsumption);

    const app = context?.app || (await WorkspaceManager.instance.pickFolder("to report object consumption"));
    if (!app) {
        return;
    }

    const consumption = ConsumptionCache.instance.getConsumption(app.hash);
    const report = generateConsumptionReport(consumption);
    await processReport(report, app);
}
