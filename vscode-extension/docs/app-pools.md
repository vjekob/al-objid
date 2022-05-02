# Application Pools

Application pools is an AL Object ID Ninja feature that allows multiple apps share the same consumption
information about object IDs.

> **IMPORTANT: This feature is in preview mode. It has been tested and it is fully functional, but it
is a little bit too simple and may require better tooling or back-end support.**

### What are Application Pools?

Application pools is a group of apps that share the same object IDs. Once you consume an object ID from
one app, it immediately becomes unavailable for assignment in any other app belonging to the same pool.

### Who needs Application Pools?

There are many scenarios in which application pools are not just preferable, but indispensable:
* Splitting one large partner range across multiple partner apps, especially for legacy apps.
* Multiple PTE (per-tenant extensions) for the same customer absolutely must cause no ID conflict, but
without application pools it's practically impossible to make sure all IDs are unique across all PTEs.

There are more scenarios, these are just two most obvious examples.

## Creating an Application Pool

To create an application pool, use the `Ninja: Create a simple App Pool (Preview)` command. This command
allows will create a new pool ID and assign your app to that pool. If you have multiple apps in your
workspace (multi-root workspace) you can choose which apps you want to include in your pool.

When you create a pool, Ninja defines the `appPoolId` property in the `.objidconfig` configuration file 
in your app root, or in root of each app you selected (in a multi-root workspace).

> Keep in mind that to create an application pool, your local Git repository must be clean. Creating a
pool, especially in a multi-root workspaces, is a sensitive operation, and Ninja will automatically
commit this operation to all affected Git repositories.

## Joining an Application Pool

If you want to join another application to an existing pool, simply copy the `appPoolId` property from
an app which is already in that pool, and then manually define it in `.objidconfig` file of the app that
you want to join to the pool.

If the pool has been authorized, you will also need to copy the `authKey` property!

> In the future, this operation will be automated.

## Leaving the Application Pool

When you want to remove an application from a pool, just delete the `appPoolId` property from the
`.objidconfig` file of the app you want to remove from the pool. If there is `authKey` property in that
file, then you must delete that property, too.

## Application Pools and authorization

Application pools use the same authorization mechanisms as simple application. Just like you can authorize
an application to prevent unauthorized developers from consuming your object IDs, you can do the same with
application pools.

> Before joining an application to an application pool, that application pool must not be authorized.

You authorize and deauthorize application pools exactly in the same way as you authorize or deauthorize
applications. When an application belongs to a pool, authorizing that app will authorize the entire pool;
likewise, deauthorizing that app will deauthorize the entire pool.

> **IMPORTANT: This feature will be massively improved in an upcoming version.**

## Application Pools and synchronization

Application pools and synchronization are very tricky. This is probably #1 reason why this feature still
carries the *"Preview"* moniker.

> **IMPORTANT: If you are not sure about what synchronization is, please read the [synchronization
documentation](https://github.com/vjekob/al-objid/blob/master/doc/Synchronization.md).

With stand-alone apps (those not belonging to a pool), synchronization is simple. All object ID consumption
is based on a single app in a single repository. When you synchronize it, you run no risk of marking any of
IDs that are already consumed as available, thus risking object ID collision.

However, when you have application pools, unless you have all apps in a single workspace, synchronizing
an app that belongs in a pool in the replace mode will only mark those object IDs as consumed that are
present in the app that is being synchronized. Any other apps in the pool will now see all other IDs from
all other apps in the pool as available.

There is no easy solution to this problem. This is not to say a solution won't come, it's just that when
using application pools, you need to be aware of this issue.

When you need to synchronize application pool consumption, possible approaches are:
* Define one multi-root workspace that includes all apps in the pool, and then run auto-synchronization
from that app.
* Run replace synchronization from one app, then run update synchronization from all other apps.
