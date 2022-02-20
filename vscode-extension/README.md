# AL Object ID Ninja

Zero-configuration, dead-simple, no-collision object ID assignment for multi-user repositories.

## Why do I need this extension?

Object ID collisions are a reality of every AL development team. Sooner or later two developers will assign
the same object ID to different objects they create. In the best case, this causes manual renumbering work.
In the worst case you have a broken build.

AL Object ID Ninja solves this problem. It uses a central object ID cache that keeps track, in real time,
of all object IDs your team members assigned to their objects. Unlike the AL Language, AL Object ID Ninja
will never suggest the same object ID to developers working on the same app at the same time.

![Assigning object IDs](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/assigning-id.gif)

> In the example above, while the AL extension doesn't see that codeunit ID `50108` is already assigned
by another developer, AL Object ID Ninja sees it. Also, AL Object ID Ninja sees that somebody even
assigned `50109` while IntelliSense dropdown was open, so you only get to assign ID `50110`. No more
object ID collisions.

## Business as usual

The most beautiful part about AL Object ID Ninja is not that it just works out of the box without
any configuration. It's actually that you don't need to change anything about how you are assigning
object IDs! You keep using IntelliSense and you keep accepting the first suggestion there, and that's
all.

> AL Object ID Ninja does not replace the object ID suggestions made by AL. It just put its own
suggestions on top of those made by AL.

## Getting started

To get started, you download this extension and start using it. It's that simple! No configuration is
needed, and you can use it on your existing projects as well as the new ones without any limitations.

While AL Object ID Ninja back end requires some information to be available before it can start
assigning new IDs to your team, it will synchronize this information for you automatically.

![Getting started](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/getting-started.gif)

That's it! Now everyone on your team can assign objects ID without fear of collision.

## How does this AL Object ID Ninja do this?

AL Object ID Ninja uses Azure serverless back end to coordinate object ID assignment across your team.
When you request an object ID from IntelliSense, AL Object ID Ninja will ask the back end for the next
available number. When you accept the suggestion from IntelliSense, it commits the number to the back
end so that nobody else will receive that suggestion.

The information this extension exchanges with the back end is minimal. It only sends this:
* SHA256 hash of the `id` from `app.json`. This identifies the app in the back end, but since it's a
hash, it does not expose the actual app id to anyone.
* `idRanges` from `app.json`. This is needed so that the back end can know which object IDs are
available for assignment.
* Type of the object for the ID is needed.
* User name of the developer who requested it. This is only needed for notifications, and you can switch
this one off if you don't like your name to be shared.

## Features

Here's what AL Object ID Ninja can do.

### Automatic assignment of object IDs.

Object IDs are assigned through the back end in two steps. First, when you trigger IntelliSense, the
extension does a soft fetch of the next available object ID for that object type. The soft fetch
retrieves the next available number, but does not record that number as assigned yet.

If you reject the suggestion, nothing happens. Your soft-fetched object ID is not marked as
assigned. It will be suggested to the next person who invokes IntelliSense to auto-suggest the next
available object ID number.

When you accept the IntelliSense suggestion, two things happen. First, IntelliSense inserts the
soft-fetched object ID. But then AL Object Ninja hard fetches the next available object ID from the
back end. The hard fetch both retrieves the next available number, and commits it to the back end
cache. Then, if the hard-fetched object ID is different than the soft-fetched object ID, AL Object
Ninja replaces the object ID in the code with the hard-fetched one.

Seriously. No object ID collisions will happen as long as everyone on your team is using AL Object
ID Ninja.

### Overview of consumed object IDs, per app, per range

Range Explorer feature shows you an overview of consumed and available object IDs, per app, per
range, per object type. The view is live, and updates whenever you or your colleagues assign new
object IDs using AL Object ID Ninja.

![Rnage Explorer](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/range-explorer.png)

### Warnings about running out of available object IDs

Don't you hate when you are out of available IDs to assign to new objects, and you only figure that
out when you need to assign a new ID?

AL Object ID Ninja takes care of that by warning you ahead of time.

![Warning about running out of IDs](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/run-out-warning.gif)

Not only Ninja will show this warning, it will also be smart about it. No matter how large (or
small) your available ranges are, Ninja will let you know in time that your range is running out.
And no worries, it won't bug you with those notifications. You will only see the exact same
notification only once per session, and you can switch them off altogether if you prefer just
hitting the wall.

### Support for multi-root workspaces

AL Object ID Ninja fully supports multi-root workspaces. No matter if you have single AL app or
multiple AL apps in any single-root or multi-root configuration, AL Object ID Ninja will always
correctly identify which AL app the action is for.

Whenever AL Object ID Ninja is not sure, for example when you have no editor tabs open, and there
are more than one AL app folders in the current workspace, it will ask you which one the action
is for.

### Notifications of assignment made by other users

Whenever another user assigns an object ID from AL Object ID Ninja, everyone working on the same
app at that time receives notifications.

![Object ID Assignment Notifications](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/assigning-id-multiuser.gif)

> Note: You can switch the notifications off in your settings.

### Synchronization of previously assigned object IDs

You can synchronize object IDs between the repository and the back-end cache. Objects can go out
of sync naturally by developers occasionally deleting existing objects from the repository; or
accidentally by developers accidentally assigning ID multiple times for the same object. You can
synchronize objects at any time your branch is in sync with all other branches (meaning there
are no active branches on which developers have new objects not yet merged into mainline).

![Synchronizing object IDs](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/synchronization.gif)

> Note: Automatic detection of object deletion and automatic releasing of freed-up object IDs
is currently in development and will be included in the next version.

Learn more about synchronization: https://github.com/vjekob/al-objid/tree/master/doc/Synchronization.md

### Simple and lightweight

The best tools are those that do their job without taking your attention away from your task. Even
better tools are those that you don't even notice while you use them.

AL Object ID Ninja was built with two non-functional goals in mind: it has to be simple to use from
the first second, and it must not slow you down while you are writing your code.

#### It's so simple you won't even notice it

While you are writing code, AL Object ID Ninja will do its job silently in the background. It's one
job is to give you object IDs that won't collide. And that's what it does. It places its object ID
suggestion right where AL Language used to place theirs: on the top of the IntelliSense list.

![Using IntelliSense](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/intellisense.gif)

Your focus stays on your code while AL Object ID Ninja does its magic for you. And it works in all
scenarios: plain code, snippets, you name it.

#### It's crazy fast!

Seriously, AL Object ID Ninja will blow your mind away with how fast it is. It's impossibly lightweight
both in the front end and in the back end, and whatever task you put in front of it, it will get it
done in - quite literally - no time!

Getting new object ID won't ever slow you down:

![Crazy fast retrieving object IDs](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/crazy-fast-1.gif)

And what about synchronization? When you need to synchronize your object IDs with the back end, AL
Object ID Ninja must read and parse every single file in your repository. While most other tools
are notoriously slow at parsing objects, AL Object ID Ninja will do this in a blink of an eye, even
when there are thousands of files to process:

![Crazy fast parsing](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/crazy-fast-2.gif)

And just for the kick of it, you can choose whether you want it fast and reliable, or even faster
(and still reliable).

> Note: Actual speed may vary depending on your hardware and internet connection. The videos in here
are recorded on an Intel(R) Core(TM) i7-10750H CPU @ 2.60GHz with 32 GB of RAM, with a Samsung SSD
drive.

### Full logging

AL Object ID Ninja doesn't hide any of its mastery from you. Everything it does, every call it makes
to the back end, every response it receives, it logs in its dedicated output channel.

### App authorization 

For AL Object ID Ninja to work out of the box without any configuration for every AL developer in
the world, the communication must happen over public API endpoints. While all communication happens
securely over HTTPS, anyone can communicate with the same back end and exchange the same content as
you. This makes it possible for malicious users to launch a kind of a denial-of-service attack
against your development team, and make your object ID assignment unreliable by syncing fake
object ID assignment information.

AL Object ID Ninja has a simple security mechanism to prevent that: App Authorization. You can
authorize your app with the back end and receive your own per-app authorization key.

![Authorizing your app](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/authorization.gif)

Once an app is authorized, every request it makes must include this authorization key and back end
will reject any requests made without or with an invalid authorization key.

![Attempting to use an invalid key](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/invalid-key.gif)

You can revoke existing authorization keys and request new ones at any time.

![Re-authorizing your app to request new authorization key](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/re-authorization.gif)

Learn more about authorization: https://github.com/vjekob/al-objid/tree/master/doc/Authorization.md

### Making it extra secure: configuring your own back end

The extension uses public Azure Functions endpoints for communication with the back-end service.
You don't need to configure anything. However, if you are concerned with your information being
shared across a public network with public services, you may want to deploy your own AL Object
ID Ninja infrastructure.

If you choose to do so, please read the [Deploying a Self-Maintained Back End](https://github.com/vjekob/al-objid/tree/master/doc/DeployingBackEnd.md) document.

While AL Object ID Ninja does not expose any of your sensitive information, since this is a
public service, you may want to use your own back end instead. This is possible. In that case, do this:
1. Deploy the Azure Functions application from the `backend` directory onto your own Azure subscription.
2. Configure the back-end URL and back-end key in your Visual Studio Code settings.

![Configuring back end](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/back-end-configuration.png)

## Upcoming features

These features are planned for future versions:
* Up-to-date information about current object through status bar. You will be able to see if the
object you are working on is using a properly recorded ID assignment.
* Automatic fixes of various out-of-sync situations.
* Testability. Duh! I wanted to get this extension out to the world as soon as possible. Not that
this is actually a feature, but for all you purists out there, it's coming.

## Special thanks

Special thanks to [waldo](https://twitter.com/waldo1001) who brainstormed this extension with me
and tested the snot out of it.
