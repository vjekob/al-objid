import * as fs from "fs";
import { Uri } from "vscode";
import { PropertyBag } from "./PropertyBag";
import { NinjaALRange } from "./types";
import { stringify, parse } from "comment-json";
import { LogLevel, output } from "../features/Output";
import { Backend } from "./Backend";
import { ALObjectType } from "./constants";

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
    private readonly _appIdHash: string;
    private readonly _config: ObjIdConfigJson;
    private _authKeyValidPromise: Promise<boolean> | undefined;
    private _logicalRangeNames: string[] | undefined;

    public constructor(uri: Uri, appIdHash: string) {
        this._uri = uri;
        this._appIdHash = appIdHash;
        this._config = this.read();
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

    public get uri() {
        return this._uri;
    }

    public get authKey(): string {
        return this._config.authKey || "";
    }

    public set authKey(value: string | undefined) {
        this.setProperty(ConfigurationProperty.AuthKey, value);
    }

    public async isAuthKeyValid(): Promise<boolean> {
        if (this._authKeyValidPromise) {
            return this._authKeyValidPromise;
        }
        this._authKeyValidPromise = new Promise<boolean>(async resolve => {
            const info = await Backend.getAuthInfo(this._appIdHash, this.authKey);
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
        const ranges = this._config.idRanges;
        for (let range of ranges) {
            if (names.find(name => name.toLowerCase().trim() === range.description.toLowerCase().trim())) {
                continue;
            }
            names.push(range.description);
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

    public get bcLicense(): string {
        return this._config.bcLicense || "";
    }

    public set BCLicense(value: string | undefined) {
        this.setProperty(ConfigurationProperty.BcLicense, value);
    }
}
