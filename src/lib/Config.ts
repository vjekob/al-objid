import { workspace, WorkspaceConfiguration } from "vscode";
import { DisposableHolder } from "../features/DisposableHolder";

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

    get backEndUrl(): string {
        return this._config.get<string>("backEndUrl") || "";
    }

    get backEndAPIKey(): string {
        return this._config.get<string>("backEndAPIKey") || "";
    }

    get showEventLogNotifications(): boolean {
        let config = this._config.get<boolean>("showEventLogNotifications");
        if (typeof config === "undefined") config = true;
        return !!config;
    }
}
