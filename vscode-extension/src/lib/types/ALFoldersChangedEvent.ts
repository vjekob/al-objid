import { ALApp } from "../ALApp";

export interface ALFoldersChangedEvent {
    /**
     * AL Apps that have been added to the workspace.
     */
    added: ALApp[];

    /**
     * AL Apps that have been removed from the workspace.
     */
    removed: ALApp[];
}
