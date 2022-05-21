import { Uri } from "vscode";
import { ALApp } from "../ALApp";

export interface ALFoldersChangedEvent {
    /**
     * AL Apps that have been added to the workspace.
     */
    added: ALApp[];

    /**
     * Uris of any AL App folders removed from the workspace.
     * This is `Uri[]` rather than `ALApp[]` because any `ALApp` instances will have been disposed by the time
     * the event is fired.
     */
    removed: Uri[];
}
