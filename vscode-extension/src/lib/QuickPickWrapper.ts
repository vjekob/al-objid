import { QuickPick, QuickPickItem, window } from "vscode";

interface QuickPickItemWrapper<T> extends QuickPickItem {
    data: T;
}

export class QuickPickWrapper<T> {
    private _resolved: boolean = false;
    private _selectedOne: T | undefined = undefined;
    private _selectedMany: T[] = [];
    private _quickPick: QuickPick<QuickPickItemWrapper<T>>;
    private _resolveOne?: (result: T | undefined) => void;
    private _resolveMany?: (result: T[]) => void;

    private resolve(success: boolean) {
        if (this._resolved) return;

        this._resolved = true;
        if (this._quickPick.canSelectMany) {
            this._resolveMany!(success ? this._selectedMany : []);
        } else {
            this._resolveOne!(success ? this._selectedOne : undefined);
        }
    }

    private show() {
        this._quickPick.onDidAccept(() => this.onDidAccept());
        this._quickPick.onDidHide(() => this.onDidHide());
        this._quickPick.show();
    }

    private onDidAccept() {
        this.resolve(true);
        this._resolved = true;
        this._quickPick.hide();
    }

    private onDidHide() {
        this.resolve(false);
        this._quickPick.dispose();
    }

    public constructor(items: QuickPickItemWrapper<T>[]) {
        this._quickPick = window.createQuickPick<QuickPickItemWrapper<T>>();
        this._quickPick.items = items;
    }

    public get placeholder(): string | undefined {
        return this._quickPick.placeholder;
    }

    public set placeholder(value: string | undefined) {
        this._quickPick.placeholder = value;
    }

    public get ignoreFocusOut(): boolean {
        return this._quickPick.ignoreFocusOut;
    }

    public set ignoreFocusOut(value: boolean) {
        this._quickPick.ignoreFocusOut = value;
    }

    public async pickOne(): Promise<T | undefined> {
        this._quickPick.onDidChangeSelection(selected => {
            this._selectedOne = selected.length ? selected[0].data : undefined;
        });
        this.show();
        return new Promise(resolve => (this._resolveOne = resolve));
    }

    public async pickMany(): Promise<T[]> {
        this._quickPick.canSelectMany = true;
        this._quickPick.onDidChangeSelection(selected => {
            this._selectedMany = selected.map(item => item.data);
        });
        this.show();
        return new Promise(resolve => (this._resolveMany = resolve));
    }
}
