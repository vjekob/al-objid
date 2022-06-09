import { ALObjectType } from "../../../src/functions/v2/ALObjectType";
import { AppInfo, LogEntry, Range } from "../../../src/functions/v2/TypesV2";
import { ContentAnalyzer, StubBuilder } from "../Storage.fake.types";

let app = 0;
let key = Date.now();

export const appId = () => `app-${Date.now()}-${app++}`;
export const authKey = () => `key-${key--}`;

export class StubStorage extends StubBuilder implements ContentAnalyzer {
    private _contentSerialized: string = "";
    private _content: Object = {};
    private _appId: string;
    private _authKey: string = "";
    private _app: AppInfo;

    constructor() {
        super();
        this.serializeContent();
    }

    private serializeContent() {
        this._contentSerialized = JSON.stringify(this._content);
    }

    app(explicitAppId?: string) {
        this.serializeContent();

        this._app = {} as AppInfo
        this._appId = explicitAppId || appId();
        this._content[`${this._appId}.json`] = this._app;
        this.serializeContent();
        return this;
    }

    authorize() {
        this._app._authorization = {
            key: this._authKey = authKey(),
            valid: true,
        };
        this.serializeContent();
        return this;
    }

    setConsumption(objectType: ALObjectType, ids: number[]) {
        this._app[objectType] = ids;
        this.serializeContent();
        return this;
    }

    setLog(log: LogEntry[]) {
        this._app._log = log;
        return this;
    }

    setAppInspectionContext(appId: string) {
        this._appId = appId;
        this._app = this._content[`${this._appId}.json`];
    }

    get appId(): string {
        return this._appId;
    }

    get authKey(): string {
        return this._authKey;
    }

    get content(): {} {
        return this._content;
    }

    objectIds(objectType: ALObjectType): number[] {
        const app = this._content[`${this._appId}.json`] || {};
        return app[objectType];
    }

    hasChanged(): boolean {
        return JSON.stringify(this._content) !== this._contentSerialized;
    }
    isAuthorized(): boolean {
        const app = this._content[`${this._appId}.json`];
        return !!(app && app._authorization && app._authorization.key && app._authorization.valid);
    }
    ranges(): Range[] {
        const app = this._content[`${this._appId}.json`] || {};
        return app._ranges || [];
    }
    log(): LogEntry[] {
        const app = this._content[`${this._appId}.json`] || {};
        return app._log;
    }

    toALObjectType(value: string): ALObjectType {
        return value as ALObjectType;
    }
}
