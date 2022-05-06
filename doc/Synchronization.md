# Object ID Synchronization in AL Object ID Ninja

While AL Object ID Ninja is zero-configuration and literally works out of the box without any need
for set up or configuration before you can use it, for it to give correct object ID suggestions
that will not result in collision, the back end must have accurate information about object IDs
that are already assigned in your app.

## How does synchronization work

When you trigger object ID synchronization (both manually and automatically), AL Object ID Ninja
will read every AL file in the repository and will retrieve type and object IDs from all of
objects defined in each file.

To detect objects in files it uses a purposely-built parser. It's not using Regex (which would
be unreliable) nor is it using the actual AL compiler (which would be much slower). If Microsoft
at some point exposes the schema information and makes it publicly accessible, that feature
will be used.

> If you know of a way how to retrieve accurate object type and ID information from an AL repo,
> please contribute to AL Object ID Ninja or share your knowledge with me. At the moment, the AL
> Object ID Ninja uses an extremely fast algorithm that's able to parse several thousand files in
> under a second (depending on your processor and disk speed, of course).

## Getting the back end in sync for the first time

When you attempt to assign an object ID in an app for the first time, the back end will realize
that it knows nothing about any object IDs your app may have already used. When this happens, the
AL Object ID Ninja will automatically suggest to synchronize with the back end.

![Synchronizing for the first time](./images/getting-started.gif)

From this moment on, whenever developers assign numbers through AL Object ID Ninja, those numbers
are recorded in the back end and will never be suggested to other developers.

However, every repository is a living thing, and actual object ID assignments in your repository
may get out of sync with the back end. In all those situations, you will have to synchronize with
the back end to get the assignment in sync again.

## Running synchronization manually

Objects can occasionally get out of sync. In those situations, you can trigger synchronization
manually.

![Running synchronization manually](./images/manual-synchronization.gif)

There are two types of manual synchronization: _update_ and _replace_.

### Update synchronization

Update synchronization (or merge synchronization) combines any object ID assignment information that's
already recorded in the back end with any new object ID assignment information that exists only in front
end.

For example, your back end contains information about codeunits `50100..50105`. You check out a branch
that has codeunits `50110..50115`. If you run synchronization and choose the `Update` option, the back
end will contain information about codeunits `50100..50105, 50110..50115`.

Typical use cases for update synchronization are:

- Synchronizing initially from multiple branches
- Occasionally working offline and then syncing up when back online

### Replace synchronization

Replace synchronization (or full synchronization) discards any existing object ID assignment information
from the back end, and then records the new object ID assignment information from the front end.

For example, your back end contains information about codeunits `50100..50105`. You check out a branch
that has codeunits `50110..50115`. If you run synchronization and choose the `Replace` option, the back
end will contain information about codeunits `50110..50115`.

Typical use cases for replace synchronization:

- Initial synchronization
- Releasing possible unused object IDs after larger refactoring or longer development cycles

## How can object IDs get out of sync?

There are several ways how object ID assignment can get out of sync.

### Deleting an existing object

If you decide you no longer need an object, you delete it from your repository. However, the object
ID it used is still recorded as assigned, even though the object is no longer there.

While it is really easy to detect that a file is deleted, a deleted file doesn't really mean an
object is no longer there. Switching from a branch on which the object was added into a branch where
it does not (yet) exist will also register as a file deletion.

At this time, AL Object ID Ninja does not do anything about deletions. When you delete objects,
especially a lot of them in a short time span, you should synchronize with the back end.

### Accidentally assigning multiple object IDs to the same object

A developer may accidentally (or intentionally!) trigger IntelliSense and assign a new object ID to
the same object several times in a row. For example, you trigger IntelliSense to soft-retrieve an
object ID, then you accept the suggestion to commit it. Then you delete the object ID and repeat the
process. Since AL Object ID Ninja has committed the previous assignment in the back end, it will
suggest the next available object number. Your previously assigned number is really still available,
but AL Object Ninja does not know it until you synchronize your object ID assignments.

AL Object ID Ninja does not do anything that directly prevents this. When this happens, its most
likely an accident.

> I am currently working on improving this a lot. Subsequent object ID assignments for the same
> objects in the same files will be properly handled by AL Object ID Ninja.

### Modifying object ID assignments

You may want to change an object ID assignment after you have already created an object. When this
happens, it's very similar to this accidental multiple assignment described in the previous section.

> This is also on the feature list I am working on.

## Should I run synchronization just in case?

No. Please don't synchronize just in case. You should synchronize only after doing heavy refactorings
or if you run out of object IDs. Often it will happen that for the reasons listed above some object
IDs will really be available even though the back end does not know that.
