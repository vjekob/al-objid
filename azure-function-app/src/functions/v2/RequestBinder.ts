import { Context } from "@azure/functions";
import { Blob } from "../../common/Blob";

interface Binding {
    path: string;
    container?: string;
    property: string;
}

export interface PropertyBinder {
    to: (property: string) => void;
}

export class RequestBinder {
    private _bindings: Binding[] = [];

    public getPropertyBinder(path: string, container?: string): PropertyBinder {
        if (this._bindings.find(binding => binding.path === path)) {
            throw new Error(`Binding for ${path} already exists`);
        }

        return {
            to: (property: string) => {
                if (this._bindings.find(binding => binding.property === property)) {
                    throw new Error(`Binding to ${property} already exists`);
                }
                this._bindings.push({ path, container, property });
            }
        };
    }

    public async getBindings<T>(context: Context, body: any): Promise<T> {
        let bindings: any = {};
        for (let binding of this._bindings) {
            let value: any = undefined;
            let { path, container, property } = binding;
            try {
                let match: RegExpExecArray;
                let regex = /\{(?<prop>.+?)\}/;
                while (match = regex.exec(path)) {
                    let { prop } = match.groups;
                    let name = body[prop];
                    if (!body[prop] || typeof name !== "string") {
                        continue;
                    }
                    path = path.replace(match[0], body[prop]);
                }

                let blob = new Blob(path, container);
                value = await blob.read();
            } catch (e) {
                context.log(`Binding exception occurred while binding "${path}" to "${property}": ${e}`);
            }
            bindings[property] = value;
        }

        return bindings;
    }
}
