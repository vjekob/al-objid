import { Disposable } from "vscode";

// TODO Either drop DisposableHolder or make it Disposable itself
// Instead of calling its getDisposables, rather dispose of all disposables in the implemented dispose() method
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
