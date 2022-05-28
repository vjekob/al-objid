import { LogicalObjectTypeRangeConsumptionNode } from "./LogicalObjectTypeRangeConsumptionNode";
import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { AppAwareNode } from "../Explorer/AppAwareNode";
import { Node } from "../Explorer/Node";
import { ObjectTypeNode } from "./ObjectTypeNode";
import { LogicalObjectTypeRangeNode } from "./LogicalObjectTypeRangeNode";

/**
 * Represents an individual logical object type range specified under `objectTypes` in `.objidconfig`.
 */
export class LogicalObjectTypeNode extends ObjectTypeNode {
    protected override readonly _iconPath = new ThemeIcon("layout");
    protected override readonly _collapsibleState = TreeItemCollapsibleState.Expanded;

    constructor(parent: AppAwareNode, objectType: string) {
        super(parent, objectType);
        this._tooltip = `Logical ranges for ${objectType} objects, defined in .objidconfig`;
    }

    protected override getChildren(): Node[] {
        const logicalRanges = this.app.config.getObjectTypeRanges(this._objectType);
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
                : new LogicalObjectTypeRangeNode(this, this._objectType, name, logicalRanges);
        });

        return children;
    }
}
