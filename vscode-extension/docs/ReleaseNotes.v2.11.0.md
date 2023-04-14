# Release Notes for AL Object ID Ninja version 2.11.0

Welcome to AL Object ID Ninja version 2.11.0!

## What's new?

These are the new features and changes in AL Object ID Ninja v2.11.0:

-   [Report consumption feature](https://github.com/vjekob/al-objid/issues/33)
-   Assignment explorer
-   Warnings on manually assigned objects

## Report consumption

This feature allows you to export summarized object ID consumption data into JSON, XML, CSV, Markdown, or plain text.

![Report consumption feature](https://raw.github.com/vjekob/al-objid/master/doc/images/report-consumption.gif)

You can:

-   Export to clipboard
-   Save to a file
-   Report on number of consumed IDs vs. total available IDs. This is especially useful for maintaning on-prem licenses, where you can use this consumption report to assign object IDs to the license, and you can see how many objects are left to be assigned.

## Assignment explorer

Assignment Explorer iprovides an overview of manually assigned object IDs that may potentially cause conflicts, as well as object IDs that have been assigned but the object itself has been deleted or no longer exists (this can occur when a developer assigns an object ID using AL Object ID Ninja, but then deletes that object).

The Assignment Explorer allows developers to identify and fix both types of issues directly from the view, making the development process more efficient and reducing the risk of conflicts. Developers can quickly see which object IDs have been manually assigned and which ones are lost, and then take action to release or reclaim them as needed. By resolving lost object IDs, developers can free up valuable IDs for use in other parts of the application.

![Assignment explorer feature](https://raw.github.com/vjekob/al-objid/master/doc/images/assignment-explorer.png)

## Warnings on manually assigned objects

When a developer manually assigns an object ID, Ninja indicates that it's a manual assignment by adding a warning directly in the code editor. The same warning is also displayed in the Problems panel. This allows the developer to quickly identify which object IDs are manually assigned and could potentially cause conflicts.

To prevent these conflicts, Ninja provides a quick fix called "Store ID assignment". This quick fix stores the manual assignment in the back end, which makes sure that the object ID is not suggested again to other developers, thus preventing conflicts.

![Warning on manually assigned object ID](https://raw.github.com/vjekob/al-objid/master/doc/images/manual-assignment-warning.gif)
