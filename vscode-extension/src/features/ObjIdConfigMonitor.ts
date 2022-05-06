import path = require("path");
import { Disposable, RelativePattern, Uri, workspace } from "vscode";
import { ALWorkspace } from "../lib/ALWorkspace";
import { getManifest } from "../lib/AppManifest";
import { Backend } from "../lib/Backend";
import { DOCUMENTS, LABELS } from "../lib/constants";
import { showDocument } from "../lib/functions";
import { Git } from "../lib/Git";
import { Telemetry } from "../lib/Telemetry";
import { AppManifest } from "../lib/types";
import { UI } from "../lib/UI";
import { AuthorizationStatusBar } from "./AuthorizationStatusBar";

export class ObjIdConfigMonitor implements Disposable {
    private _repos: { uri: Uri; manifest: AppManifest }[] = [];
    private _workspaceFoldersChangeEvent: Disposable;
    private _watchers: Disposable[] = [];
    private _disposed: boolean = false;
    private _timeout: NodeJS.Timeout | undefined;
    private _currentBranches: { [key: string]: string } = {};

    public constructor() {
        this.setUpWatchers();
        this._workspaceFoldersChangeEvent = workspace.onDidChangeWorkspaceFolders(
            this.onDidChangeWorkspaceFolders.bind(this)
        );
    }

    private onDidChangeWorkspaceFolders() {
        this.disposeWatchers();
        this.setUpWatchers();
    }

    private clearBranchTimeout() {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
    }

    private async checkCurrentBranches() {
        this.clearBranchTimeout();
        const promises: Promise<string>[] = [];
        for (let repo of this._repos) {
            promises.push(
                (repo => {
                    const promise = Git.instance.getCurrentBranchName(repo.uri);
                    promise.then(branch => (this._currentBranches[repo.manifest.id] = branch));
                    return promise;
                })(repo)
            );
        }
        await Promise.all(promises);
        this._timeout = setTimeout(() => this.checkCurrentBranches(), 10000);
    }

    private validateFile(manifest: AppManifest) {
        manifest.ninja.config.idRanges; // This reads them, and reading validates them
        manifest.ninja.config.validateObjectRanges();
        manifest.ninja.config.bcLicense; // This reads them, and reading validates them
    }

    private async onDeleted(manifest: AppManifest, uri: Uri) {
        const currentBranch = this._currentBranches[manifest.id];
        const { authKey } = manifest.ninja.config;
        const info = await Backend.getAuthInfo(manifest.id, authKey);
        if (!info?.authorized) {
            return;
        }

        let branch = await Git.instance.getCurrentBranchName(uri);
        if (branch !== currentBranch) {
            if (
                (await UI.authorization.showUnauthorizedBranch(branch, manifest)) ===
                LABELS.BUTTON_LEARN_MORE
            ) {
                showDocument(DOCUMENTS.AUTHORIZATION_BRANCH_CHANGE);
            }
            return;
        }

        Telemetry.instance.log("critical.objIdConfigDeleted", manifest.id);
        if (
            (await UI.authorization.showDeletedAuthorization(manifest)) === LABELS.BUTTON_LEARN_MORE
        ) {
            showDocument(DOCUMENTS.AUTHORIZATION_DELETED);
        }
    }

    private async onDidChange(manifest: AppManifest, uri: Uri) {
        this.validateFile(manifest);
        AuthorizationStatusBar.instance.updateStatusBar();
    }

    private async setUpWatcher(manifest: AppManifest, uri: Uri) {
        const watcher = workspace.createFileSystemWatcher(path.join(uri.fsPath, ".objidconfig"));
        watcher.onDidDelete(() => this.onDeleted(manifest, uri));
        watcher.onDidChange(() => this.onDidChange(manifest, uri));
        this._watchers.push(watcher);

        const gitRoot = await Git.instance.getTopLevelPath(uri);
        const gitHEAD = new RelativePattern(gitRoot, ".git/HEAD");
        const gitWatcher = workspace.createFileSystemWatcher(gitHEAD);
        gitWatcher.onDidChange(async () => {
            this._currentBranches[manifest.id] = await Git.instance.getCurrentBranchName(uri);
        });
        this._watchers.push(gitWatcher);
        this.validateFile(manifest);
    }

    private setUpWatchers() {
        let folders = ALWorkspace.getALFolders();
        if (!folders) {
            return;
        }
        this._repos = [];
        for (let folder of folders) {
            const manifest = getManifest(folder.uri)!;
            this._repos.push({ uri: folder.uri, manifest });
            this.setUpWatcher(manifest, folder.uri);
        }
        this.checkCurrentBranches();
    }

    private disposeWatchers() {
        for (let disposable of this._watchers) {
            disposable.dispose();
        }
        this._watchers = [];
    }

    dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.clearBranchTimeout();
        this.disposeWatchers();
        this._workspaceFoldersChangeEvent.dispose();
    }
}
