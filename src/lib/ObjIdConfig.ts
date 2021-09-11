import { Uri, workspace } from "vscode";
import path = require("path");
import * as fs from "fs";
import { Output } from "../features/Output";
import { stringify, parse } from "comment-json";
import { PropertyBag } from "./PropertyBag";

export interface ObjIdConfiguration {
    [key: symbol]: [any];
    authKey?: string;
    appPoolId?: string;
}

export const CONFIG_FILE_NAME = ".objidconfig";

const COMMENTS: PropertyBag<string> = {
    authKey: "This is the authorization key for all back-end communication. Do not modify or delete this value!"
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

    private read(): ObjIdConfiguration {
        try {
            return parse(fs.readFileSync(this._path).toString() || "{}") as unknown as ObjIdConfiguration;
        } catch (e) {
            Output.instance.log(`Cannot read file ${path}: ${e}`);
            return {} as ObjIdConfiguration;
        }
    }

    private write(object: ObjIdConfiguration) {
        fs.writeFileSync(this._path, stringify(object, null, 2));
    }

    private setComment(config: ObjIdConfiguration, property: string) {
        let value = COMMENTS[property];
        let key = Symbol.for(`before:${property}`);
        if (!config[key]) config[key] = [{
            type: "LineComment",
            value
        }];
    }

    private removeComment(config: ObjIdConfiguration, property: string) {
        delete config[Symbol.for(`before:${property}`)];
    }

    private setProperty<T>(config: ObjIdConfiguration, property: string, value?: T) {
        if (value) {
            (config as any)[property] = value;
            this.setComment(config, property);
        } else {
            delete config.authKey;
            this.removeComment(config, property);
        }
    }

    get authKey(): string {
        let config = this.read();
        return config.authKey || "";
    }

    set authKey(value: string) {
        let config = this.read();
        this.setProperty(config, "authKey", value);
        this.write(config);
    }
}
