import { Command, CompletionItem, CompletionItemKind, MarkdownString, Position, Range, TextEdit, Uri, workspace, WorkspaceEdit } from "vscode";
import { Backend, NextObjectIdInfo } from "../lib/Backend";
import { AppManifest } from "../lib/AppManifest";
import { Authorization } from "../lib/Authorization";
import { output } from "./Output";

export type CommitNextObjectId = (manifest: AppManifest) => Promise<NextObjectIdInfo>;

export class NextObjectIdCompletionItem extends CompletionItem {
    constructor(type: string, objectId: NextObjectIdInfo, manifest: AppManifest, position: Position, uri: Uri, ) {
        super(`${objectId.id}`, CompletionItemKind.Constant);

        this.sortText = "0";
        this.command = this.getCompletionCommand(position, uri, type, manifest, objectId);
        this.documentation = this.getCompletionDocumentation(type, objectId);
        this.insertText = `${objectId.id}`;
    }

    getCompletionCommand(position: Position, uri: Uri, type: string, manifest: AppManifest, objectId: NextObjectIdInfo): Command {
        return {
            command: "vjeko-al-objid.commit-suggestion",
            title: "",
            arguments: [async () => {
                output.log(`Commiting object ID auto-complete for ${type} ${objectId.id}`);
                const key = Authorization.read(uri);
                const realId = await Backend.getNextNo(manifest.id, type, manifest.idRanges, true, key?.key || "");
                if (!realId || !realId.available || realId.id === objectId.id) return;
                output.log(`Another user has consumed ${type} ${objectId.id} in the meantime. Retrieved new: ${type} ${realId.id}`);
    
                let replace = new WorkspaceEdit();
                replace.set(uri, [TextEdit.replace(new Range(position, position.translate(0, objectId.id.toString().length)), `${realId.id}`)]);
                workspace.applyEdit(replace);
            }]
        };
    }
    
    getCompletionDocumentation(type: string, objectId: NextObjectIdInfo): MarkdownString {
        const message = new MarkdownString("Assigns the next available object ID from the Azure back end.");
        message.appendCodeblock(`${type} ${objectId.id}`, "al");
        if (!objectId.hasConsumption) {
            message.appendMarkdown("**Important:** The back end has no object ID consumption information. Please, run `Vjeko: Synchronize object IDs with the Azure back end` command before accepting this object ID.");
            return message;
        }
        message.appendMarkdown("This number is **temporary**. The actual number will be assigned when you select this auto-complete entry.")
    
        return message;
    }        
}
