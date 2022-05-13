import { TreeView, window } from "vscode";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { ExpandCollapseController } from "./ExpandCollapseController";
import { NinjaTreeDataProvider } from "./NinjaTreeDataProvider";
import { INinjaTreeItem } from "./NinjaTreeItem";

export class TreeViews {
    private static _instance: TreeViews;

    private constructor() {}

    public static get instance() {
        return this._instance || (this._instance = new TreeViews());
    }

    private _views: PropertyBag<TreeView<any>> = {};
    private _controllers: PropertyBag<ExpandCollapseController> = {};

    public registerView(id: string, provider: NinjaTreeDataProvider): TreeView<INinjaTreeItem> {
        const view = window.createTreeView(id, { treeDataProvider: provider });

        const controller = new ExpandCollapseController(id);
        provider.registerExpandCollapseController(controller);

        view.onDidCollapseElement(e => {
            controller.collapse(e.element.id);
            controller.reset();
        });
        view.onDidExpandElement(e => {
            controller.expand(e.element.id);
            controller.reset();
        });

        this._controllers[id] = controller;
        this._views[id] = view;

        return view;
    }

    public getExpandCollapse(id: string): ExpandCollapseController | undefined {
        return this._controllers[id];
    }
}
