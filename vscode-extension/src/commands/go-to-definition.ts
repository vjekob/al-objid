import { commands, DocumentSymbol, Selection, window, workspace } from "vscode";
import { jsonAvailable } from "../features/linters/jsonAvailable";
import { GoToDefinitionCommandContext } from "../features/treeView/rangeExplorer/commandContexts/GoToDefinitionCommandContext";
import { CodeCommand } from "./commands";

export function goToDefinition(context: GoToDefinitionCommandContext) {
    switch (context.file) {
        case "manifest":
            goToManifest(context);
            break;

        case "configuration":
            goToConfiguration(context);
            break;
    }
}

async function goToManifest(context: GoToDefinitionCommandContext) {
    await jsonAvailable;

    const { uri } = context.app.manifest;

    const symbols = await (commands.executeCommand(CodeCommand.ExecuteDocumentSymbolProvider, uri) as Promise<
        DocumentSymbol[] | undefined
    >);

    const editor = await window.showTextDocument(uri);

    if (symbols) {
        const idRanges = symbols.find(symbol => symbol.name === "idRanges");
        if (!idRanges) {
            return;
        }
        switch (context.type) {
            case "idRanges":
                editor.selection = new Selection(idRanges!.range.start, idRanges!.range.end);
                break;

            case "range":
                const range = idRanges.children.find(child =>
                    child.children.find(child => child.name === "from" && child.detail == `${context.range!.from}`)
                );
                if (range) {
                    editor.selection = new Selection(range.range.start, range.range.end);
                }
                break;
        }
    }
}

async function goToConfiguration(context: GoToDefinitionCommandContext) {
    await jsonAvailable;
    workspace.openTextDocument(context.app.config.uri);
}
