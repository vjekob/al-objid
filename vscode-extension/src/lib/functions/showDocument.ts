import * as path from "path";
import { commands, Uri } from "vscode";
import { CodeCommand } from "../../commands/commands";
import { Telemetry, TelemetryEventType } from "../Telemetry";

export function showDocument(document: string) {
    Telemetry.instance.log(TelemetryEventType.ShowDocument, undefined, { document });
    commands.executeCommand(
        CodeCommand.MarkdownShowPreview,
        Uri.file(path.join(__dirname, `../../../docs/${document}.md`))
    );
}
