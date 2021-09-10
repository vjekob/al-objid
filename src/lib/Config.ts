import { workspace, WorkspaceConfiguration } from "vscode";
import { DisposableHolder } from "../features/DisposableHolder";
import { User } from "./User";

const CONFIG_SECTION = "objectIdNinja";

export class Config extends DisposableHolder {
    private _config: WorkspaceConfiguration;
    private static _instance: Config;

    private constructor() {
        super();
        this._config = workspace.getConfiguration(CONFIG_SECTION);
        this.registerDisposable(workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(CONFIG_SECTION)) {
                this._config = workspace.getConfiguration(CONFIG_SECTION);
            }
        }));
    }

    public static get instance(): Config {
        return this._instance || (this._instance = new Config());
    }

    private getWithDefault<T>(setting: string, defaultValue: T) {
        let config = this._config.get<T>(setting);
        if (typeof config === "undefined") config = defaultValue;
        return config;
    }

    public get backEndUrl(): string {
        return this._config.get<string>("backEndUrl") || "";
    }

    public get backEndAPIKey(): string {
        return this._config.get<string>("backEndAPIKey") || "";
    }

    public get showEventLogNotifications(): boolean {
        return this.getWithDefault<boolean>("showEventLogNotifications", true);
    }

    public get overrideUserName(): string {
        return this._config.get<string>("overrideUserName") || User.username;
    }

    public get includeUserName(): boolean {
        return this.getWithDefault<boolean>("includeUserName", true);
    }
}
