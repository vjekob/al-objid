import { commands, Disposable } from "vscode";
import { authorizeApp } from "./authorize-app";
import { autoSyncObjectIds } from "./auto-sync-object-ids";
import { collapseAllRangeExplorer } from "./collapse-all-rangeExplorer";
import { commitSuggestion } from "./commit-suggestion";
import { confirmAuthorizeApp } from "./confirm-authorize-app";
import { confirmDeauthorizeApp } from "./confirm-deauthorize-app";
import { confirmSyncObjectIds } from "./confirm-sync-object-ids";
import { consolidateRanges } from "./consolidate-ranges";
import { copyRanges } from "./copy-ranges";
import { createAppPool } from "./create-app-pool";
import { deauthorizeApp } from "./deauthorize-app";
import { expandAllRangeExplorer } from "./expand-all-rangeExplorer";
import { goToDefinition } from "./goto-definition";
import { quickFixRemoveDeclaration } from "./quickfix-remove-declaration";
import { quickFixRemoveProperty } from "./quickfix-remove-property";
import { quickFixSelectValidType } from "./quickfix-select-valid-type";
import { selectBCLicense } from "./select-bclicense";
import { showReleaseNotes } from "./show-release-notes";
import { syncObjectIds } from "./sync-object-ids";
import { validateLicense } from "./validate-bclicense";
import { reportConsumption } from "./report-consumption";
import { QuickFixStoreIdAssignment } from "./quickfix-store-id-assignment";
import reclaimObjectId from "./reclaim-object-id";
import confirmReclaimObjectId from "./confirm-reclaim-object-id";
import storeIdAssignment from "./store-id-assignment";

export enum CodeCommand {
    SetContext = "setContext",
    MarkdownShowPreview = "markdown.showPreview",
    ExecuteDocumentSymbolProvider = "vscode.executeDocumentSymbolProvider",
    ExecuteFormatProvider = "vscode.executeFormatDocumentProvider",
}

export enum NinjaCommand {
    ConfirmSyncObjectIds = "vjeko-al-objid.confirm-sync-object-ids",
    ConfirmAuthorizeApp = "vjeko-al-objid.confirm-authorize-app",
    ConfirmDeauthorizeApp = "vjeko-al-objid.confirm-deauthorize-app",
    AutoSyncObjectIds = "vjeko-al-objid.auto-sync-object-ids",
    ShowReleaseNotes = "vjeko-al-objid.show-release-notes",
    CopyRanges = "vjeko-al-objid.copy-ranges",
    ConsolidateRanges = "vjeko-al-objid.consolidate-ranges",
    CreateAppPool = "vjeko-al-objid.create-app-pool",
    ValidateLicense = "vjeko-al-objid.validate-bclicense",
    SelectBCLicense = "vjeko-al-objid.select-bclicense",
    ReportConsumption = "vjeko-al-objid.report-consumption",
    CommitSuggestion = "vjeko-al-objid.commit-suggestion",
    SyncObjectIds = "vjeko-al-objid.sync-object-ids",
    AuthorizeApp = "vjeko-al-objid.authorize-app",
    DeauthorizeApp = "vjeko-al-objid.deauthorize-app",
    QuickFixRemoveDeclaration = "vjeko-al-objid.quickfix-remove-declaration",
    QuickFixSelectValidType = "vjeko-al-objid.quickfix-select-valid-type",
    QuickFixRemoveProperty = "vjeko-al-objid.quickfix-remove-property",
    QuickFixStoreIdAssignment = "vjeko-al-objid.quickfix-store-id-assignment",
    ExpandAllRangeExplorer = "vjeko-al-objid.expand-all-rangeExplorer",
    CollapseAllRangeExplorer = "vjeko-al-objid.collapse-all-rangeExplorer",
    GoToDefinition = "vjeko-al-objid.goto-definition",
    ReclaimObjectId = "vjeko-al-objid.reclaim-object-id",
    ConfirmReclaimObjectId = "vjeko-al-objid.confirm-reclaim-object-id",
    StoreIdAssignment = "vjeko-al-objid.store-id-assignment",
}

export const commandMap: { [key: string]: (...args: any[]) => any } = {
    [NinjaCommand.ConfirmSyncObjectIds]: confirmSyncObjectIds,
    [NinjaCommand.ConfirmAuthorizeApp]: confirmAuthorizeApp,
    [NinjaCommand.ConfirmDeauthorizeApp]: confirmDeauthorizeApp,
    [NinjaCommand.AutoSyncObjectIds]: autoSyncObjectIds,
    [NinjaCommand.ShowReleaseNotes]: showReleaseNotes,
    [NinjaCommand.CopyRanges]: copyRanges,
    [NinjaCommand.ConsolidateRanges]: consolidateRanges,
    [NinjaCommand.CreateAppPool]: createAppPool,
    [NinjaCommand.ValidateLicense]: validateLicense,
    [NinjaCommand.SelectBCLicense]: selectBCLicense,
    [NinjaCommand.ReportConsumption]: reportConsumption,
    [NinjaCommand.CommitSuggestion]: commitSuggestion,
    [NinjaCommand.SyncObjectIds]: syncObjectIds,
    [NinjaCommand.AuthorizeApp]: authorizeApp,
    [NinjaCommand.DeauthorizeApp]: deauthorizeApp,
    [NinjaCommand.QuickFixRemoveDeclaration]: quickFixRemoveDeclaration,
    [NinjaCommand.QuickFixSelectValidType]: quickFixSelectValidType,
    [NinjaCommand.QuickFixRemoveProperty]: quickFixRemoveProperty,
    [NinjaCommand.QuickFixStoreIdAssignment]: QuickFixStoreIdAssignment,
    [NinjaCommand.ExpandAllRangeExplorer]: expandAllRangeExplorer,
    [NinjaCommand.CollapseAllRangeExplorer]: collapseAllRangeExplorer,
    [NinjaCommand.GoToDefinition]: goToDefinition,
    [NinjaCommand.ReclaimObjectId]: reclaimObjectId,
    [NinjaCommand.ConfirmReclaimObjectId]: confirmReclaimObjectId,
    [NinjaCommand.StoreIdAssignment]: storeIdAssignment,
};

export function* registerCommands(): Generator<Disposable> {
    for (let key of Object.keys(commandMap)) {
        yield commands.registerCommand(key, commandMap[key]);
    }
}
