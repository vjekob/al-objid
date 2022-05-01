import { Uri, workspace } from "vscode";
import path = require("path");
import * as fs from "fs";
import { LogLevel, Output } from "../features/Output";
import { stringify, parse } from "comment-json";
import { PropertyBag } from "./PropertyBag";
import { NinjaALRange } from "./types";

enum ConfigurationProperty {
    AuthKey = "authKey",
    AppPoolId = "appPoolId",
    BackEndUrl = "backEndUrl",
    BackEndApiKey = "backEndApiKey",
    Ranges = "idRanges",
}

export const CONFIG_FILE_NAME = ".objidconfig";

const COMMENTS: PropertyBag<string> = {
    [ConfigurationProperty.AuthKey]: "This is the authorization key for all back-end communication. DO NOT MODIFY OR DELETE THIS VALUE!",
    [ConfigurationProperty.Ranges]: "You can customize and describe your logical ranges here"
};

export class ObjIdConfig {
    //#region Singleton map
    private static _instances: PropertyBag<ObjIdConfig> = {};

    public static instance(uri: Uri): ObjIdConfig {
        return this._instances[uri.fsPath] || (this._instances[uri.fsPath] = new ObjIdConfig(uri));
    }

    private constructor(uri: Uri) {
        const folder = workspace.getWorkspaceFolder(uri);
        this._path = path.join(folder!.uri.fsPath, CONFIG_FILE_NAME);
    }
    //#endregion

    private _path: fs.PathLike;

    private read(): any {
        try {
            return parse(fs.readFileSync(this._path).toString() || "{}") as any;
        } catch (e: any) {
            if (e.code !== "ENOENT") Output.instance.log(`Cannot read file ${path}: ${e}`, LogLevel.Info);
            return {};
        }
    }

    private write(object: any) {
        fs.writeFileSync(this._path, stringify(object, null, 2));
    }

    private setComment(config: any, property: ConfigurationProperty) {
        const value = COMMENTS[property];
        if (!value) {
            return;
        }
        
        const key = Symbol.for(`before:${property}`);
        if (!config[key]) config[key] = [{
            type: "LineComment",
            value: ` ${value}`,
        }];
    }

    private removeComment(config: any, property: ConfigurationProperty) {
        delete config[Symbol.for(`before:${property}`)];
    }

    private getProperty<T>(property: ConfigurationProperty): T {
        let config = this.read();
        return config[property];
    }

    private setProperty<T>(property: ConfigurationProperty, value?: T) {
        let config = this.read();
        if (value) {
            config[property] = value;
            this.setComment(config, property);
        } else {
            delete config[property];
            this.removeComment(config, property);
        }
        this.write(config);
    }

    get authKey(): string {
        return this.getProperty(ConfigurationProperty.AuthKey) || "";
    }

    set authKey(value: string) {
        this.setProperty(ConfigurationProperty.AuthKey, value);
    }

    get idRanges(): NinjaALRange[] {
        return this.getProperty(ConfigurationProperty.Ranges) || [];
    }

    set idRanges(value: NinjaALRange[]) {
        this.setProperty(ConfigurationProperty.Ranges, value);
    }

    /* TODO Implement custom back-end in .objIdConfig
    get backEndUrl(): string {
        return this.getProperty(ConfigurationProperty.BackEndUrl) || "";
    }

    set backEndUri(value: string) {
        this.setProperty(ConfigurationProperty.BackEndUrl, value);
    }

    get backEndApiKey(): string {
        return this.getProperty(ConfigurationProperty.BackEndApiKey) || "";
    }

    set backEndApiKey(value: string) {
        this.setProperty(ConfigurationProperty.BackEndApiKey, value);
    }
    */
}
