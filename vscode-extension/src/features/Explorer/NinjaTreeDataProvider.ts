import { ALApp } from "../../lib/ALApp";
import { DisposableNinjaTreeItem, NinjaTreeItem } from "./NinjaTreeItem";

export interface NinjaTreeDataProvider {
    getRootChild(app: ALApp, update: () => void): DisposableNinjaTreeItem | Promise<DisposableNinjaTreeItem>;
}
