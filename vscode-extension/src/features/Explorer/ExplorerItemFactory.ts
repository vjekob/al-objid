import { Uri } from "vscode";
import { getManifest } from "../../lib/AppManifest";
import { ALRange } from "../../lib/types";
import { ExplorerItem } from "./ExplorerItem";
import { ObjectTypeExplorerItem } from "./ObjectTypeExplorerItem";
import { RangeExplorerItem } from "./RangeExplorerItem";
import { TextExplorerItem } from "./TextExplorerItem";
import { WorkspaceExplorerItem } from "./WorkspaceExplorerItem";

export class ExplorerItemFactory {
    static workspace(uri: Uri): ExplorerItem {
        return new WorkspaceExplorerItem(getManifest(uri)!);
    }

    static range(appId: string, range: ALRange): ExplorerItem {
        return new RangeExplorerItem(appId, range);
    }

    static objectType(appId: string, range: ALRange, objectType: string, ids: number[], size: number): ExplorerItem {
        return new ObjectTypeExplorerItem(appId, range, objectType, ids, size);
    }

    static text(text: string, tooltip: string) {
        return new TextExplorerItem(text, tooltip);
    }
}
