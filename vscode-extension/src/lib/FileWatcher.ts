import { Disposable, EventEmitter, FileSystemWatcher, RelativePattern, Uri, workspace } from "vscode";
import { GIT_HEAD } from "./constants";
import { Git } from "./Git";

export class FileWatcher implements Disposable {
    private readonly _uri: Uri;
    private readonly _watcher: FileSystemWatcher;
    private readonly _onCreated = new EventEmitter<boolean>();
    private readonly _onChanged = new EventEmitter<boolean>();
    private readonly _onDeleted = new EventEmitter<boolean>();
    public readonly onCreated = this._onCreated.event;
    public readonly onChanged = this._onChanged.event;
    public readonly onDeleted = this._onDeleted.event;
    private _gitWatcher: FileSystemWatcher | undefined;
    private _gitAware: boolean = false;
    private _gitBranch: string | undefined;
    private _disposables: Disposable[] = [];
    private _disposed = false;

    public constructor(uri: Uri) {
        this._uri = uri;
        const fileGlob = uri.fsPath;
        this._watcher = workspace.createFileSystemWatcher(fileGlob, false, false, false);
        this._watcher.onDidCreate(() => this.onDidCreate(), this._disposables);
        this._watcher.onDidChange(() => this.onDidChange(), this._disposables);
        this._watcher.onDidDelete(() => this.onDidDelete(), this._disposables);

        this.setUpGitWatcher();
    }

    private async setUpGitWatcher() {
        if (!(await Git.instance.isInitialized(this._uri))) {
            return;
        }

        this._gitAware = true;

        const updateBranchName = () => {
            // We don't want the branch change event immediately. If branch change affects this file,
            // then the relevant watcher event will update the branch name.
            setTimeout(async () => {
                this._gitBranch = await Git.instance.getCurrentBranchName(this._uri);
            }, 5000);
        };

        const gitRoot = await Git.instance.getTopLevelPath(this._uri);
        const gitHeadPattern = new RelativePattern(gitRoot, GIT_HEAD);
        this._gitWatcher = workspace.createFileSystemWatcher(gitHeadPattern);
        this._gitWatcher.onDidChange(updateBranchName);
        updateBranchName();
    }

    private async isGitEvent(): Promise<boolean> {
        let gitEvent = false;
        if (this._gitAware) {
            const branch = await Git.instance.getCurrentBranchName(this._uri);
            if (branch !== this._gitBranch) {
                this._gitBranch = branch;
                gitEvent = true;
            }
        }
        return gitEvent;
    }

    private async onDidCreate() {
        const gitEvent = await this.isGitEvent();
        this._onCreated.fire(gitEvent);
    }

    private async onDidChange() {
        const gitEvent = await this.isGitEvent();
        this._onChanged.fire(gitEvent);
    }

    private async onDidDelete() {
        const gitEvent = await this.isGitEvent();
        this._onDeleted.fire(gitEvent);
    }

    public dispose() {
        if (this._disposed) {
            return;
        }

        this._disposed = true;
        this._watcher.dispose();
        this._onCreated.dispose();
        this._onChanged.dispose();
        this._onDeleted.dispose();
        if (this._gitWatcher) {
            this._gitWatcher.dispose();
        }

        this._disposables.forEach(disposable => disposable.dispose());
    }
}
