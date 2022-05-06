import { ReleaseNotesHandler } from "../features/ReleaseNotesHandler";

/**
 * Opens the release notes panel for the current version (if the release notes are available).
 */
export const showReleaseNotes = () => ReleaseNotesHandler.instance.forceShowReleaseNotes();
