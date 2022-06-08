import { Uri, ThemeIcon, TreeItemLabel, TreeItemCollapsibleState } from "vscode";
import { ALApp } from "../../../../lib/ALApp";
import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { DecorableDescendantNode } from "../../DecorableNode";
import { DecorationSeverity } from "../../DecorationSeverity";
import { ALAppsGroupNode } from "./ALAppsGroupNode";

export class ALAppNode extends DecorableDescendantNode {
    protected readonly _iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon;
    protected readonly _uriAuthority: string;
    protected readonly _uriPathPart: string;
    protected _label: string | TreeItemLabel;
    protected _collapsibleState = TreeItemCollapsibleState.None;

    constructor(parent: ALAppsGroupNode, app: ALApp, isCloud: boolean) {
        super(parent);
        this._iconPath = isCloud ? NinjaIcon["al-app-cloud"] : NinjaIcon["al-app"];
        this._uriAuthority = `${parent.appPoolId}`;
        this._uriPathPart = app.hash;
        this._label = app.name;
        this._description = isCloud ? "Other" : "This repository";

        this._decoration = {
            severity: DecorationSeverity.inactive,
        };
    }
}
