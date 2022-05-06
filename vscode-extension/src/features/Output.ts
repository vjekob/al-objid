import { OutputChannel, window } from "vscode";
import { Config } from "../lib/Config";
import { EXTENSION_NAME } from "../lib/constants";
import { DisposableHolder } from "./DisposableHolder";

export enum LogLevel {
    Verbose = "LogLevel.Verbose",
    Info = "LogLevel.Info",
}

export class Output extends DisposableHolder {
    private _channel: OutputChannel;
    private static _instance: Output;

    private constructor() {
        super();
        this.registerDisposable((this._channel = window.createOutputChannel(EXTENSION_NAME)));
        this.log("Starting AL Object ID Ninja", LogLevel.Info);
    }

    public static get instance(): Output {
        return this._instance || (this._instance = new Output());
    }

    public log(message: string, level: LogLevel = LogLevel.Verbose) {
        switch (level) {
            case LogLevel.Info:
                // Just log
                break;
            case LogLevel.Verbose:
                if (!Config.instance.useVerboseOutputLogging) return;
                break;
        }

        if (message) {
            this._channel.appendLine(`[${new Date().toISOString()}] ${message}`);
        }
    }
}

export const output = Output.instance;
