import { ExplorerItem } from "./ExplorerItem";
import { ExplorerItemType } from "./ExplorerItemType";

export class TextExplorerItem extends ExplorerItem {
    constructor(text: string, tooltip: string) {
        super(text, tooltip);
    }

    type = ExplorerItemType.text;
    hasChildren = false;
}
