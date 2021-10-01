import path = require("path");
import { commands, ExtensionContext, extensions, Uri } from "vscode";
import * as fs from "fs";
import { Config } from "../lib/Config";

export class ReleaseNotesHandler {
    public check(context: ExtensionContext) {
        const version = extensions.getExtension("vjeko.vjeko-al-objid")?.packageJSON?.version;

        if (!version) {
            return;
        }

        this.checkNotes(version, context);
    }

    private stateKey(version: string) {
        return `release-notes/${version}`;
    }

    private releaseNotesUri(version: string): Uri {
        return Uri.file(path.join(__dirname, `../../docs/ReleaseNotes.v${version}.md`));
    }

    private releaseNotesExist(version: string): boolean {
        try {
            let stat = fs.statSync(this.releaseNotesUri(version).fsPath);
            return stat.isFile();
        } catch {
            return false;
        }
    }

    private showReleaseNotes(version: string, context: ExtensionContext) {
        if (!Config.instance.showReleaseNotes) {
            return;
        }
        context.globalState.update(this.stateKey(version), true);
        commands.executeCommand("markdown.showPreview", this.releaseNotesUri(version));
    }

    private checkNotes(version: string, context: ExtensionContext) {
        if (context.globalState.get(this.stateKey(version))) {
            return;
        }
        if (this.releaseNotesExist(version)) {
            this.showReleaseNotes(version, context);
        }
    }
}
