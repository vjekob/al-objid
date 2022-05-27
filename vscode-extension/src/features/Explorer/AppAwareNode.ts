import { ALApp } from "../../lib/ALApp";
import { Node } from "./Node";

export interface AppAwareNode extends Node {
    readonly app: ALApp;
}

export interface AppAwareDescendantNode extends AppAwareNode {
    readonly parent: AppAwareNode;
}
