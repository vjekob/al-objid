import { Node } from "./Node";

export interface ViewController {
    /**
     * Triggers the update of the view, starting from the specified node.
     * @param node Node to update
     */
    update(node: Node): void;
}
