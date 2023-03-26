import * as fs from "fs";
import * as path from "path";
import { Uri, workspace, WorkspaceFolder } from "vscode";
import { PropertyBag } from "./types/PropertyBag";
import { BackEndAppInfo } from "./backend/BackEndAppInfo";
import { NinjaALRange } from "./types/NinjaALRange";
import { stringify, parse } from "comment-json";
import { LogLevel, output } from "../features/Output";
import { Backend } from "./backend/Backend";
import { ALObjectType } from "./types/ALObjectType";
import { BCLicense } from "./BCLicense";
import { ObjIdConfigLinter } from "../features/linters/ObjIdConfigLinter";
import { Telemetry, TelemetryEventType } from "./Telemetry";

interface ObjIdConfigJson {
    authKey: string;
    appPoolId: string;
    idRanges: NinjaALRange[];
    objectRanges: PropertyBag<NinjaALRange[]>;
    bcLicense: string;
}

export enum ConfigurationProperty {
    AuthKey = "authKey",
    AppPoolId = "appPoolId",
    Ranges = "idRanges",
    ObjectRanges = "objectRanges",
    BcLicense = "bcLicense",
}

const COMMENTS: PropertyBag<string> = {
    [ConfigurationProperty.AuthKey]:
        "This is the authorization key for all back-end communication. DO NOT MODIFY OR DELETE THIS VALUE!",
};

export class ObjIdConfig {
    private readonly _uri: Uri;
    private readonly _backEndAppInfo: BackEndAppInfo;
    private readonly _config: ObjIdConfigJson;
    private readonly _folder: WorkspaceFolder;
    private _authKeyValidPromise: Promise<boolean> | undefined;
    private _logicalRangeNames: string[] | undefined;
    private _bcLicense: string | undefined = undefined;
    private _bcLicensePromise?: Promise<BCLicense | undefined>;
    private _bcLicensePropertiesSet = false;

    public constructor(uri: Uri, backEndAppInfo: BackEndAppInfo) {
        this._uri = uri;
        this._backEndAppInfo = backEndAppInfo;
        this._folder = workspace.getWorkspaceFolder(uri)!;
        this._config = this.read();

        const linter = new ObjIdConfigLinter(uri);
        linter.validate();
    }

    private read(): ObjIdConfigJson {
        try {
            const content = fs.readFileSync(this._uri.fsPath).toString() || "{}";
            return parse(content) as ObjIdConfigJson;
        } catch (e: any) {
            if (e.code !== "ENOENT") {
                output.log(`Cannot read file ${this._uri.fsPath}: ${e}`, LogLevel.Info);
            }
            return {} as ObjIdConfigJson;
        }
    }

    private write() {
        fs.writeFileSync(this._uri.fsPath, stringify(this._config, null, 2));
    }

    private setComment(property: ConfigurationProperty) {
        const value = COMMENTS[property];
        if (!value) {
            return;
        }

        const key = Symbol.for(`before:${property}`);
        if (!(this._config as any)[key])
            (this._config as any)[key] = [
                {
                    type: "LineComment",
                    value: ` ${value}`,
                },
            ];
    }

    private removeComment(config: any, property: ConfigurationProperty) {
        delete config[Symbol.for(`before:${property}`)];
    }

    private setProperty<T>(property: ConfigurationProperty, value?: T) {
        if (value) {
            (this._config as any)[property] = value;
            this.setComment(property);
        } else {
            delete (this._config as any)[property];
            this.removeComment(this._config as any, property);
        }
        this.write();
    }

    private setBcLicenseProperties() {
        if (this._bcLicensePropertiesSet) {
            return;
        }
        this._bcLicensePropertiesSet = true;

        const relativePath = this._config.bcLicense;
        if (!relativePath) {
            return;
        }

        this._bcLicense = path.isAbsolute(relativePath)
            ? relativePath
            : path.join(this._folder.uri.fsPath, relativePath);

        if (fs.existsSync(this._bcLicense)) {
            this._bcLicensePromise = new Promise<BCLicense | undefined>(resolve =>
                setTimeout(() => resolve(new BCLicense(this._bcLicense!, this._folder.uri)))
            );
        }
    }

    public get uri() {
        return this._uri;
    }

    public get authKey(): string {
        return this._config.authKey || "";
    }

    public set authKey(value: string | undefined) {
        this.setProperty(ConfigurationProperty.AuthKey, value);
    }

    public removeProperty(name: string) {
        this.setProperty(name as ConfigurationProperty, undefined);
    }

    public async isAuthKeyValid(): Promise<boolean> {
        if (this._authKeyValidPromise) {
            return this._authKeyValidPromise;
        }
        this._authKeyValidPromise = new Promise<boolean>(async resolve => {
            const info = await Backend.getAuthInfo(this._backEndAppInfo, this.authKey);
            resolve(!info || !info.authorized || info.valid);
        });
        return this._authKeyValidPromise;
    }

    public get appPoolId(): string {
        return this._config.appPoolId || "";
    }

    public set appPoolId(value: string | undefined) {
        this.setProperty(ConfigurationProperty.AppPoolId, value);
    }

    public get idRanges(): NinjaALRange[] {
        return [...(this._config.idRanges || [])];
    }

    public set idRanges(value: NinjaALRange[]) {
        this.setProperty(ConfigurationProperty.Ranges, value);
    }

    public get objectRanges(): PropertyBag<NinjaALRange[]> {
        return this._config.objectRanges || {};
    }

    /**
     * Returns the object types specified in `objectRanges` property.
     */
    get objectTypesSpecified(): string[] {
        const validTypes = Object.values<string>(ALObjectType);
        return Object.keys(this.objectRanges).filter(type => validTypes.includes(type));
    }

    /**
     * Returns names of logical ranges specified in `idRanges` property.
     */
    get logicalRangeNames(): string[] {
        if (this._logicalRangeNames) {
            return this._logicalRangeNames;
        }

        const names: string[] = [];
        const ranges = this._config.idRanges || [];
        for (let range of ranges) {
            if (!range) {
                continue;
            }
            if (names.find(name => name.toLowerCase().trim() === (range.description || "").toLowerCase().trim())) {
                continue;
            }
            names.push(range.description || "");
        }
        this._logicalRangeNames = names;
        return names;
    }

    /**
     * Gets explicitly defined ranges for the specified object type. These are ranges specified in `objectRanges`
     * property.
     * @param objectType Object type for which to get ranges
     * @returns Ranges explicitly defined for specified object type
     */
    getObjectTypeRanges(objectType: string): NinjaALRange[] {
        return this.objectRanges[objectType] || this.idRanges;
    }

    /**
     * Sets (or clears/unsets) explicit ranges for an object type.
     * @param objectType Object type for which to set ranges
     * @param value Ranges to set or undefined to unset
     */
    setObjectTypeRanges(objectType: string, value: NinjaALRange[] | undefined) {
        const allObjectRanges = this.objectRanges;
        if (value) {
            allObjectRanges[objectType] = value;
        } else {
            delete allObjectRanges[objectType];
        }
        this.setProperty(ConfigurationProperty.ObjectRanges, allObjectRanges);
    }

    public get bcLicense(): string | undefined {
        this.setBcLicenseProperties();
        return this._bcLicense;
    }

    public set bcLicense(value: string | undefined) {
        this.setProperty(ConfigurationProperty.BcLicense, value);
    }

    public async getLicenseObject(): Promise<BCLicense | undefined> {
        this.setBcLicenseProperties();
        if (!this._bcLicensePromise) {
            return undefined;
        }

        return await this._bcLicensePromise;
    }
}
