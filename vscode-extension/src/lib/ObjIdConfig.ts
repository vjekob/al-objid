import { Uri, workspace } from "vscode";
import path = require("path");
import * as fs from "fs";
import { LogLevel, Output } from "../features/Output";
import { stringify, parse } from "comment-json";
import { PropertyBag } from "./PropertyBag";
import { NinjaALRange } from "./types";
import { UI } from "./UI";
import { LABELS, TIME } from "./constants";

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

const idRangeWarnings: PropertyBag<number> = {};

export class ObjIdConfig {
    private readonly _path: fs.PathLike;
    private readonly _name: string;

    public constructor(uri: Uri, name: string) {
        const folder = workspace.getWorkspaceFolder(uri);
        this._path = path.join(folder!.uri.fsPath, CONFIG_FILE_NAME);
        this._name = name;
    }

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

    private getIdRanges() {
        return this.getProperty<NinjaALRange[]>(ConfigurationProperty.Ranges) || [];
    }

    private getValidRanges(ranges: NinjaALRange[]): NinjaALRange[] {
        const result = [];
        for (let range of ranges) {
            if (typeof range.from === "number" && typeof range.to === "number" && range.from && range.to) {
                result.push(range);
            } else {
                const key = `${this._path}:${range.from}:${range.to}:${range.description}`;
                if ((idRangeWarnings[key] || 0) < Date.now() - TIME.FIVE_MINUTES) {
                    UI.ranges.showInvalidRangeTypeError('', range).then(() => {
                        // When somebody dismisses the error, we want to throw it again ASAP (unless fixed)
                        delete idRangeWarnings[key];
                    });
                }
            }
        }
        return result;
    }

    get idRanges(): NinjaALRange[] {
        const ranges = this.getIdRanges().map(range => ({ ...range }));
        ranges.forEach(range => {
            if ((typeof range.from !== "number") || (typeof range.to !== "number") || (!range.to) || (!range.from)) {
                // This is a problem, but it's reported elsewhere
                return;
            }

            if (range.to < range.from) {
                const { from, to, description } = range;
                const key = `${this._path}:${range.from}:${range.to}:${range.description}`;
                if ((idRangeWarnings[key] || 0) < Date.now() - TIME.FIVE_MINUTES) {
                    idRangeWarnings[key] = Date.now();
                    UI.ranges.showInvalidRangeFromToError('', range).then(result => {
                        // When somebody dismisses the error, we want to throw it again ASAP (unless fixed)
                        delete idRangeWarnings[key];

                        if (result === LABELS.FIX) {
                            let fixed = false;
                            const ranges = this.getIdRanges();
                            for (let original of ranges) {
                                if (original.from === from && original.to === to && original.description === description) {
                                    original.from = to;
                                    original.to = from;
                                    fixed = true;
                                }
                            }
                            if (fixed) {
                                this.idRanges = ranges;
                            }
                        }
                    });
                }
                range.from = to;
                range.to = from;
            }
        });
        return this.getValidRanges(ranges);
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
