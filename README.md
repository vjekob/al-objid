# Vjeko.com AL Object ID Ninja

Zero-configuration, dead-simple, no-collision object ID assignment for multi-user repositories.

## The Good, The Bad, and The Ugly of object ID assignment

Object ID collisions are a reality of every AL development team. Sooner or later (and it's really sooner, not later)
two developers will assign the same object ID to objects they create. Everything will be fine in their locals, but if
one of them doesnt' manually take care of it, the build gets broken.

There is no easy way to avoid this problem. Either your developer must be in constant communication when assigning new
object IDs, or they have to constantly fix object ID collisions. The more people you have on your team, and the busier
your team is, the more likely you are to waste a lot of time making sure your builds don't break because of object ID
collisions.

## How does this extension help?

*Vjeko.com AL Object ID Ninja* helps by using Azure serverless back end to coordinate object ID assignment across your
team. The beautiful part is that it just works, out of the box, without any configuration. An object ID that was
consumed by one user, won't be suggested to another user. All object ID assignments are fully integrated into
Intellisense and using this feature doesn't require you to change the way you write code in any way.

In short, when using this tool, two users working at the same time won't ever get the same object ID.

## Features

Here's what *Vjeko.comAL Object ID Ninja* includes:
* Auto-suggestion of object ID while typing AL code. This extension will put its own object ID suggestion above the default one suggested by AL Language.
* Synchronization of all consumed object IDs with the back end. When requesting the first object ID, the extension will
ask you to synchronize the object IDs. You can run the synchronization manuually at any time, for example to free any
object IDs that are no longer in use.
* Secured communication. While no meaningful information is exposed (object IDs, ranges, app id)

## Configuring your own back end

The extension uses public Azure Functions endpoints for communication with the back-end service. You don't need to
configure anything. There are two kinds of requests, and this is the information they send to the back end.

| Request | Property | Description
|-|-|-|
| `getNextId` | `appId` | The `id` property from the `app.json` manifest. |
|| `type` | Type of object that you are requesting the ID for. |
|| `ranges` | The `idRanges` property from the `app.json` manifest. |
| `syncIds` | `appId` | The `id` property from the `app.json` manifest. |
|| `ids` | An object that lists all consumed IDs, per object type. For example: `codeunit: [50001,50002,50003]`|

While there is no information that exposes any of your sensitive information, since this is a public service, you
may want to use your own back end instead. This is possible. In that case, do this:
1. Deploy the Azure Functions application from the `backend` directory onto your own Azure subscription.
2. Configure the back-end URL and back-end key in your Visual Studio Code settings.

## Upcoming features

These features are planned for future versions:
* Team collaboration insights. You will be able to see when your colleagues consume object IDs. You will be able to see
an overview of last assigned IDs, who consumed them, and for what objects in which branch.
* More automation of releasing unused object IDs. You will be able to undo your object IDs automatically.
