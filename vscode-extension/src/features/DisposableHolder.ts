import { Disposable } from "vscode";

export abstract class DisposableHolder {
    private _disposables: Disposable[] = [];

    protected registerDisposable(disposable: Disposable) {
        if (!this._disposables.includes(disposable)) {
            this._disposables.push(disposable);
        }
    }

    protected prepareDisposables(): void {}

    public getDisposables(): Disposable {
        this.prepareDisposables();
        return Disposable.from(...this._disposables);
    }
}
