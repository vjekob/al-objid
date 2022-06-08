import { LogicalObjectTypeRangeConsumptionNode } from "./LogicalObjectTypeRangeConsumptionNode";
import { TreeItemCollapsibleState } from "vscode";
import { Node } from "../../Node";
import { ObjectTypeNode } from "./ObjectTypeNode";
import { LogicalObjectTypeRangesNode } from "./LogicalObjectTypeRangesNode";
import { NinjaIcon } from "../../../../lib/NinjaIcon";
import { AppPoolAwareNode } from "./AppPoolAwareNode";

/**
 * Represents an individual logical object type specified under `objectTypes` in `.objidconfig`.
 *
 * The label for this node is always equal to object type.
 *
 * This node contains children, one per each unique `description` represented among ranges defined for this object
 * type, where child type can be:
 * - {@link LogicalObjectTypeRangeNode} if multiple ranges all have this same `description` property, there is only
 * one child node of this type, that will then have its subchildren of {@link LogicalObjectTypeRangeConsumptionNode}
 * type
 * - {@link LogicalObjectTypeRangeConsumptionNode} if only a single range has this `description`
 */
export class LogicalObjectTypeNode extends ObjectTypeNode {
    protected override readonly _iconPath = NinjaIcon["object-ranges-type"];
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;

    constructor(parent: AppPoolAwareNode, objectType: string) {
        super(parent, objectType);
        this._tooltip = `Logical ranges for ${objectType} objects, defined in .objidconfig`;
    }

    protected override getChildren(): Node[] {
        const logicalRanges = this.rootNode.objectRanges[this._objectType];
        const logicalRangeNames = logicalRanges.reduce<string[]>((results, range) => {
            if (
                results.find(
                    left => (left || "").toLowerCase().trim() === (range.description || "").toLocaleLowerCase().trim()
                )
            ) {
                return results;
            }
            results.push(range.description);
            return results;
        }, []);

        const children = logicalRangeNames.map(name => {
            const compareName = (name || "").toLowerCase().trim();
            const ranges = logicalRanges.filter(
                range => (range.description || "").toLowerCase().trim() === compareName
            );
            return ranges.length === 1
                ? new LogicalObjectTypeRangeConsumptionNode(this, this._objectType, ranges[0], true)
                : new LogicalObjectTypeRangesNode(this, this._objectType, name, ranges);
        });

        return children;
    }
}
