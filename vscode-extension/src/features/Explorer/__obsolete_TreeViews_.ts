import { TreeView, window } from "vscode";
import { PropertyBag } from "../../lib/types/PropertyBag";
import { ExpandCollapseController } from "./ExpandCollapseController";
import { __obsolete_NinjaTreeDataProvider_ } from "./__obsolete_NinjaTreeDataProvider_";
import { __obsolete_INinjaTreeItem_ } from "./__obsolete_NinjaTreeItem_";

export class __obsolete_TreeViews_ {
    private static _instance: __obsolete_TreeViews_;

    private constructor() {}

    public static get instance() {
        return this._instance || (this._instance = new __obsolete_TreeViews_());
    }

    private _controllers: PropertyBag<ExpandCollapseController> = {};

    public registerView(id: string, provider: __obsolete_NinjaTreeDataProvider_): TreeView<__obsolete_INinjaTreeItem_> {
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

        return view;
    }

    public getExpandCollapse(id: string): ExpandCollapseController | undefined {
        return this._controllers[id];
    }
}
