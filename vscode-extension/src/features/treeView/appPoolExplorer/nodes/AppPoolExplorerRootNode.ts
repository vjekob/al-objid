import { AppPoolAwareNode } from "./AppPoolAwareNode";
import { ALApp } from "../../../../lib/ALApp";
import { ALRange } from "../../../../lib/types/ALRange";
import { ConsumptionData } from "../../../../lib/types/ConsumptionData";
import { NinjaALRange } from "../../../../lib/types/NinjaALRange";
import { PropertyBag } from "../../../../lib/types/PropertyBag";
import { ConsumptionCache } from "../../../ConsumptionCache";
import { Node } from "../../Node";
import { RootNode } from "../../RootNode";
import { ViewController } from "../../ViewController";
import { ALAppsGroupNode } from "./ALAppsGroupNode";
import { PhysicalRangeNode } from "./PhysicalRangeNode";
import { PhysicalRangesGroupNode } from "./PhysicalRangesGroupNode";
import { LogicalRangesGroupNode } from "./LogicalRangesGroupNode";
import { ObjectRangesGroupNode } from "./ObjectRangesGroupNode";
import { Disposable } from "vscode";

export class AppPoolExplorerRootNode extends RootNode implements AppPoolAwareNode, Disposable {
    private readonly _apps: ALApp[];
    private readonly _appPoolId: string;
    private readonly _physicalRanges: ALRange[];
    private readonly _logicalRanges: NinjaALRange[];
    private readonly _logicalRangeNames: string[];
    private readonly _objectRanges: PropertyBag<NinjaALRange[]>;
    private readonly _objectTypesSpecified: string[];
    private readonly _subscription: Disposable;
    private _consumption: ConsumptionData;
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
        this._consumption = ConsumptionCache.instance.getConsumption(appPoolId) || {};

        this._physicalRanges = this.getPhysicalRanges(apps);
        this._logicalRanges = this.getLogicalRanges(apps);
        this._logicalRangeNames = this.getLogicalRangeNames(apps);
        this._objectRanges = this.getObjectRanges(apps);
        this._objectTypesSpecified = this.getObjectTypesSpecified(apps);

        this._subscription = ConsumptionCache.instance.onConsumptionUpdate(appPoolId, () => {
            this._consumption = ConsumptionCache.instance.getConsumption(appPoolId) || {};
            this._view.update(this);
        });
    }

    private getPhysicalRanges(apps: ALApp[]): ALRange[] {
        const ranges: ALRange[] = [];
        for (let app of apps) {
            for (let range of app.manifest.idRanges) {
                ranges.push(range);
            }
        }
        return ranges;
    }

    private getLogicalRanges(apps: ALApp[]): NinjaALRange[] {
        const ranges: NinjaALRange[] = [];
        for (let app of apps) {
            for (let range of app.config.idRanges) {
                ranges.push(range);
            }
        }
        return ranges;
    }

    private getLogicalRangeNames(apps: ALApp[]): string[] {
        const names: string[] = [];
        for (let app of apps) {
            for (let name of app.config.logicalRangeNames) {
                if (!names.includes(name)) {
                    names.push(name);
                }
            }
        }
        names.sort();
        return names;
    }

    private getObjectRanges(apps: ALApp[]): PropertyBag<NinjaALRange[]> {
        const ranges: PropertyBag<NinjaALRange[]> = {};
        for (let app of apps) {
            for (let objectType of app.config.objectTypesSpecified) {
                const objectRanges = app.config.getObjectTypeRanges(objectType);
                if (ranges[objectType]) {
                    ranges[objectType].push(...objectRanges);
                } else {
                    ranges[objectType] = objectRanges;
                }
            }
        }
        return ranges;
    }

    private getObjectTypesSpecified(apps: ALApp[]): string[] {
        const objectTypes: string[] = [];
        for (let app of apps) {
            for (let objectType of app.config.objectTypesSpecified) {
                if (!objectTypes.includes(objectType)) {
                    objectTypes.push(objectType);
                }
            }
        }
        return objectTypes;
    }

    protected override getChildren(): Node[] | Promise<Node[]> {
        let children: Node[] = [new ALAppsGroupNode(this)];

        if (this.logicalRangeNames.length === 0 && this._objectTypesSpecified.length === 0) {
            children.push(...this.physicalRanges.map(range => new PhysicalRangeNode(this, range)));
        } else {
            children.push(new PhysicalRangesGroupNode(this));
        }

        if (this.logicalRangeNames.length > 0) {
            children.push(new LogicalRangesGroupNode(this));
        }
        if (this._objectTypesSpecified.length > 0) {
            children!.push(new ObjectRangesGroupNode(this));
        }

        return children;
    }

    public get apps(): ALApp[] {
        return this._apps;
    }

    public get appPoolId(): string {
        return this._appPoolId;
    }

    public get consumption(): ConsumptionData {
        return this._consumption;
    }

    public get physicalRanges(): ALRange[] {
        return this._physicalRanges;
    }

    public get logicalRanges(): NinjaALRange[] {
        return this._logicalRanges;
    }

    public get logicalRangeNames(): string[] {
        return this._logicalRangeNames;
    }

    public get objectRanges(): PropertyBag<NinjaALRange[]> {
        return this._objectRanges;
    }

    public get objectTypesSpecified(): string[] {
        return this._objectTypesSpecified;
    }

    // Implements AppPoolAwareNode
    public get rootNode(): AppPoolExplorerRootNode {
        return this;
    }

    // Implements Disposable

    public dispose() {
        this._subscription.dispose();
    }
}
