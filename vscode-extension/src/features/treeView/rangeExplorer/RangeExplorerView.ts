import { ALApp } from "../../../lib/ALApp";
import { NinjaTreeView } from "../NinjaTreeView";
import { RootNode } from "../RootNode";
import { ViewController } from "../ViewController";
import { RangeExplorerRootNode } from "./nodes/RangeExplorerRootNode";

// TODO Show individual IDs in range explorer, title = object id, description = file path
// When clicking on object id, opens the document and selects that id
// For any object consumed not by this repo, indicate with a different color that it comes from another repo
// For any such object, add commands:
// - "Investigate": checks if the object is in another branch, and if not, adds an "investigation token" in
//                  the back end that every other user will pick up and report back if they have this object
//                  in their repos, and if not, back end reports back and indicates that this object id is
//                  probably safe to release. For this we SHOULD keep name, date, time, of every object id
//                  assignment made through Ninja
// - "Release":     releases the ID in the back end and makes it available for re-assignment

export class RangeExplorerView extends NinjaTreeView {
    protected override createRootNode(app: ALApp, view: ViewController): RootNode {
        return new RangeExplorerRootNode(app, view);
    }
}
