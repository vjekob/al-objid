# Release Notes for AL Object ID Ninja version 2.1.0

> Version 2.1.0 was accidentally deployed without release notes. That's why this version is 2.1.1,
> but the release notes are about v2.1.0. There is nothing new or changed in version 2.1.1. Sorry for
> this mess.

## What's New

There are two important new features introduced in v2.1.0:

-   Range Explorer feature
-   Warnings about running out of available IDs

That's it in brief notes. If you want to know more details, read on.

## Range Explorer

To access **Range Explorer**, click on the AL Object ID Ninja icon in the activity bar:

![AL Object ID Ninja Range Explorer is marked in red](https://raw.github.com/vjekob/al-objid/master/doc/images/range-explorer-activity-bar.png)

**Range Explorer** shows the object ID consumption information per app, per range, per object type. You
can use this information to keep track of available object IDs, and to take action before you run out of
available IDs in ranges configured in your apps.

![AL Object ID Ninja Range Explorer is marked in red](https://raw.github.com/vjekob/al-objid/master/doc/images/range-explorer.png)

**Range Explorer** monitors your workspace and your `app.json` files and automatically reflects any change
in your workspace configuration or your `app.json` content (name and ranges).

Each object type shows an icon that shows roughly where you are in your object range with each tiny bar
corresponding to about 25% of range availability. As you consume more objects, there will be fewer bars
shown. Ninja uses the battery capacity analogy for this visual cue.

Any range for which there are 9 or fewer object IDs remaining will be shown with information color
emphasis (typically blue, but depends on your color theme).

Ranges with five or fewer IDs remaining are shown with warning color emphasis (typically yellow) and an
exclamation icon next to the object ID for which the range is about to be depleted.

Ranges that have no object IDs left are shown with error color emphasis (typically red) and a crossed-out
icon.

Apart from using **Range Explorer** to monitor your range consumption, you can use it to perform
ID-related tasks such as synchronization and auto-synchronization.

To run the `Ninja: Automatically Synchronize Object IDs for Entire Workspace` command, click the
double-arrow icon in the **Range Explorer** header.

![AL Object ID Ninja Range Explorer is marked in red](https://raw.github.com/vjekob/al-objid/master/doc/images/range-explorer-auto-sync.png)

To run the `Ninja: Synchronize Object IDs with Azure Back End` command for an individual app folder,
click the arrow icon next to the app folder name (you must hover over the app folder name first).

![AL Object ID Ninja Range Explorer is marked in red](https://raw.github.com/vjekob/al-objid/master/doc/images/range-explorer-sync.png)

## Warnings about running out of available IDs

Object ID collisions are not the only bad thing that can happen with object IDs. Running out of available
IDs and finding about that when you have actually ran out of them is equally bad, as anyone who has ever
been in that situation can attest.

AL Object ID Ninja now helps you realizing that you are about to run out of IDs well before that happens.

![AL Object ID Ninja Range Explorer is marked in red](https://raw.github.com/vjekob/al-objid/master/doc/images/run-out-warning.gif)

No matter how large (or small) your range is, Ninja is guaranteed to show you this information in time
for you to take action (like expanding an existing range or adding a new one).

> _Note_: This warning is not given out per range. If you have two available ranges, and you are about
> to run out of IDs on one of them, but another one has enough available IDs, Ninja will not show you a
> warning.
