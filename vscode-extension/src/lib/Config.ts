import { workspace, WorkspaceConfiguration } from "vscode";
import { DisposableHolder } from "../features/DisposableHolder";
import { User } from "./User";

const CONFIG_SECTION = "objectIdNinja";

const DEFAULT_HOST_NAME = "vjekocom-alext-weu.azurewebsites.net";
const POLL_HOST_NAME = "vjekocom-alext-weu-poll.azurewebsites.net";

export class Config extends DisposableHolder {
    private _config: WorkspaceConfiguration;
    private static _instance: Config;

    private constructor() {
        super();
        this._config = workspace.getConfiguration(CONFIG_SECTION);
        this.registerDisposable(
            workspace.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration(CONFIG_SECTION)) {
                    this._config = workspace.getConfiguration(CONFIG_SECTION);
                }
            })
        );
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
        return this._config.get<string>("backEndUrl") || DEFAULT_HOST_NAME;
    }

    public get backEndAPIKey(): string {
        return this._config.get<string>("backEndAPIKey") || "";
    }

    public get backEndUrlPoll(): string {
        return this._config.get<string>("backEndUrlPoll") || POLL_HOST_NAME;
    }

    public get backEndAPIKeyPoll(): string {
        return this._config.get<string>("backEndAPIKeyPoll") || "";
    }

    public get isDefaultBackEndConfiguration(): boolean {
        return this.backEndUrl === DEFAULT_HOST_NAME && this.backEndUrlPoll === POLL_HOST_NAME;
    }

    public get isBackEndConfigInError(): boolean {
        return !!this.backEndConfigErrorReason;
    }

    public get backEndConfigErrorReason(): string | undefined {
        if (this.backEndUrl === DEFAULT_HOST_NAME && this.backEndUrlPoll !== POLL_HOST_NAME) {
            return "Non-default poll URL with default back-end URL";
        }
        if (this.backEndUrl !== DEFAULT_HOST_NAME && this.backEndUrlPoll === POLL_HOST_NAME) {
            return "Non-default back-end URL with default poll URL";
        }
    }

    public get showEventLogNotifications(): boolean {
        return this.getWithDefault<boolean>("showEventLogNotifications", true);
    }

    public get userName(): string {
        return this._config.get<string>("overrideUserName") || User.username;
    }

    public get includeUserName(): boolean {
        return this.getWithDefault<boolean>("includeUserName", true);
    }

    public get useVerboseOutputLogging(): boolean {
        return this.getWithDefault<boolean>("useVerboseOutputLogging", true);
    }

    public get showReleaseNotes(): boolean {
        return this.getWithDefault<boolean>("showReleaseNotes", true);
    }

    public get showRangeWarnings(): boolean {
        return this.getWithDefault<boolean>("showRangeWarnings", true);
    }

    public get requestPerRange(): boolean {
        return this.getWithDefault<boolean>("requestPerRange", false);
    }
}
