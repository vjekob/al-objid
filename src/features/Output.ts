import { OutputChannel, window } from "vscode";
import { EXTENSION_NAME } from "../lib/constants";
import { DisposableHolder } from "./DisposableHolder";

export class Output extends DisposableHolder {
    private _channel: OutputChannel;
    private static _instance: Output;

    private constructor() {
        super();
        this.registerDisposable(this._channel = window.createOutputChannel(EXTENSION_NAME))
    }

    public static get instance(): Output {
        return this._instance || (this._instance = new Output());
    }

    public log(message: string) {
        if (message) {
            this._channel.appendLine(`[${new Date().toISOString()}] ${message}`);
        }
    }
}

export const output = Output.instance;
