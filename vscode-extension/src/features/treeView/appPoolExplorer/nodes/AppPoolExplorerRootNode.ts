import { ALApp } from "../../../../lib/ALApp";
import { ConsumptionCache } from "../../../ConsumptionCache";
import { Node } from "../../Node";
import { RootNode } from "../../RootNode";
import { ViewController } from "../../ViewController";
import { ALAppsGroupNode } from "./ALAppsGroupNode";

export class AppPoolExplorerRootNode extends RootNode {
    private readonly _apps: ALApp[];
    private readonly _appPoolId: string;
    protected _uriAuthority: string;
    protected _label: string;
    protected _description: string;
    protected _tooltip: string;

    constructor(appPoolId: string, apps: ALApp[], view: ViewController) {
        super(view);

        this._apps = apps;
        this._appPoolId = appPoolId;
        this._uriAuthority = appPoolId;
        this._label = appPoolId.substring(0, 8); // TODO Change
        this._description = "Simple pool"; // TODO Change
        this._tooltip = "";

        const consumption = { ...ConsumptionCache.instance };
        debugger;
    }

    protected override getChildren(): Node[] | Promise<Node[]> {
        return [new ALAppsGroupNode(this)];
    }

    public get apps(): ALApp[] {
        return this._apps;
    }

    public get appPoolId(): string {
        return this._appPoolId;
    }
}
