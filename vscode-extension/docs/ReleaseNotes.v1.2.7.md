# Release Notes for AL Object ID Ninja version 1.2.7

## What is this?

This is the first time you see this. From this version on, AL Object ID Ninja will show you the release notes
for any new version that includes change you may want to know about. Version 1.2.7 includes important changes
and new features, and this is why you are seing this document.

Don't worry. We'll not flood you with these release notes. You'll see this only when there are major changes.
Otherwise, AL Object ID Ninja will just get updated silently in the background. And you can switch off these
release notes if you don't like them.

## What's new?

The following changes are included with version 1.2.7.

### Getting ready for "v2" of Azure serverless back end

During week of October 4th 2021, the serverless back end of AL Object ID Ninja will be updated to "v2" of all
endpoints. As soon as this upgrade is in place and ready, there will be a new release of AL Object ID Ninja
(version 2.0.0) that will use "v2" endpoints.

This is a massive breaking change for all existing Business Central apps that are currently being managed by
AL Object ID Ninja. Once a user with AL Object ID Ninja version 2.0.0 accesses a "v2" endpoint for an BC app
currently under control of AL Object ID Ninja, the back-end storage for that app will be automatically
migrated to "v2". From that moment on, other users not yet using AL Object ID Ninja v2.0.0 will not be able
to assign new object IDs before they upgrade AL Object ID Ninja to version 2.0.0.

To learn more about why this is necessary and what exactly is being done to the back end, check this blog
post: https://vjeko.com/2021/10/01/important-announcement-for-al-object-id-ninja/

### Notifications and announcements

It is now possible for us to send announcements and news directly to AL Object ID Ninja. For example, if
there is a pending update, scheduled maintenance of the back end, an upcoming webcast about AL Object ID
Ninja, or anything of interest, we may push a little toast notification to you. We promise - we won't be
intrusive, and you won't be seeing too many of these. We'll send them only when something is really
important to let you know about.

Unfortunately, since these kinds of notifications are important, you are not able to switch them off
completely, but every notification is shown only once (unless you snooze it, of course), so don't worry.

### Graceful handling of 410 Gone

From time to time there are non-breaking changes in the back end when an old version of an endpoint becomes
unavailable and gets either completely discontinued or moved to a new version. In the past this has happened
with the `v1/getLog` endpoint that was updated to `v2/getLog` silently without you even noticing.

When this happens, and you have a version of AL Object ID Ninja that's still invoking an old endpoint,
you are typically unable to use a new feature, or are no longer having access to an old feature. When we
do this kind of upgrade, it's always best to update AL Object ID Ninja extension to the latest version.

In the future, whenever we update an endpoint to a new version and discontinue an old version, you'll see
a small notification toast message asking you to update.

Currently we still have users on version 1.1.0 calling our `v1/getLog` and unfortunately we have no way
of letting them know that there is a new version and that they would benefit from updating. In the future
this will no longer happen, because whenever we discontinue an endpoint, AL Object ID Ninja will notify
the user about that.

### Release notes for important new versions

This is what is happening right now. Whenever there is an important new version of AL Object ID Ninja
we'll show the release notes to you automatically, just like we did a moment ago.

If you don't want to see release notes automatically, you can disable them in the settings:

![Show Release Notes setting](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/show-release-notes.png)
