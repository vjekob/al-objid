# Release Notes for AL Object ID Ninja version 2.0.1

> **IMPORTANT**: If you are maintaining a private back end for AL Object ID Ninja, please read this document,
because the changes are made to how AL Object ID Ninja communicates with the back end. You will be required to
redeploy new back-end components in order to be able to continue using AL Object ID Ninja.

## What's new?

These are the changes and new features AL Object Ninja v2.0.1 brings:
* Toast notifications shown by Ninja are now smarter and more efficient
* Information that could identify users is now transmitted and stored in encrypted form
* Release notifications are less intrusive

That's it in brief notes. If you want to know more details, read on.

### Smarter and more efficient notifications

AL Object ID Ninja now uses a separate back end for notifications. Previously, the same serverless instance
was in charge of both handling the "smart" stuff (assigning and synchronizing, object IDs, authorizing apps,
etc.) This has caused a lot of unnecessary work on the part of the back end, and could also make Ninja back-end
response times much longer.

The additional back end is now in charge only of notifications. Whenever you assign a new object ID, the
"business logic" back end notifies the notification back end through an Azure Storage Queue message. Then,
the "notifications" back end reads the queue message and updates ins cache with the latest state of your app.

AL Object ID Ninja polls the "notification" back end every so often to check if there are any changes done by
your colleagues. If anyone working in the same app has assigned a new object ID, synchronized objects, 
authorized or deauthorized the app, everyone else will get a notification message.

Previous versions also suffered from authorization issues, theoretically allowing for a ten-minute window of
opportunity for wannabe hackers to hack into your object ID range without providing authorization key just
after an app was authorized. With this two-back-end setup, this is no longer possible.

All in all, with the new setup, notifications are adding less strain on the back end, they do not adversely
affect security, and they allow valuable and productive part of the solution to work with higher efficiency.

In addition to all this, user name information transmitted over the network and stored in the back end cache
is now encrypted. This means that absolutely all information about you or your apps are both anonymized and
encrypted, and if anyone attempts to hack the AL Object ID Ninja back end, no information about you can be
retrieved.

Polling mechanism now comes with an automatic back-off algorithm. Ninja will start polling the back end asking
for changes every 30 seconds. After two calls, if there is nothing new, it will start increasing the polling
interval gradually until it reaches 15 minutes. Therea

Finally, the notification polling mechanism is now handling news as well. Previously, news notifications were
polled with lower frequency. They are now coming through the same polling endpoint which means that they will
be as just-in-time as possible.

