import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getSha256 } from "../../lib/functions/getSha256";
import { commands, Uri } from "vscode";
import { CodeCommand } from "../../commands/commands";

async function waitForJsonActivation(): Promise<boolean> {
    // We need this because there is no other reliable way to await for activation of JSON language features, needed for symbol loading
    // Check this: https://github.com/microsoft/vscode/issues/100660
    const tempFile = path.join(os.tmpdir(), `ninja${getSha256(`${Date.now()}`)}.json`);
    if (!fs.existsSync(tempFile)) {
        fs.writeFileSync(tempFile, JSON.stringify({ ninja: "rocks" }));
    }
    const tempUri = Uri.file(tempFile);

    // Allow 60 seconds grace period to load JSON language features
    const start = Date.now();
    let interval = 100;
    let available = false;
    while (Date.now() < start + 60000) {
        available = await new Promise<boolean>(resolve => {
            setTimeout(async () => {
                const symbols = await commands.executeCommand(CodeCommand.ExecuteDocumentSymbolProvider, tempUri);
                if (symbols) {
                    resolve(true);
                }
                interval += 500;
                resolve(false);
            }, interval);
        });
        if (available) {
            break;
        }
    }

    fs.unlinkSync(tempFile);

    return available;
}

export const jsonAvailable = waitForJsonActivation();
