# Release Notes for AL Object ID Ninja version 2.0.1

> **IMPORTANT**: If you are maintaining a private back end for AL Object ID Ninja, please read this document,
> because the changes are made to how AL Object ID Ninja communicates with the back end. You will be required to
> redeploy new back-end components in order to be able to continue using AL Object ID Ninja.

## What's new?

These are the changes and new features AL Object Ninja v2.0.1 brings:

-   Toast notifications shown by Ninja are now smarter and more efficient
-   Information that could identify users is now transmitted and stored in encrypted form
-   Commands are renamed from `Vjeko: <Command Name>` to `Ninja: <Command Name>`.
-   Release notifications are less intrusive

That's it in brief notes. If you want to know more details, read on.

## Smarter and more efficient notifications

AL Object ID Ninja now uses a separate back end for notifications. Previously, the same serverless instance
was in charge of both handling the "smart" stuff (assigning and synchronizing, object IDs, authorizing apps,
etc.) This has caused a lot of unnecessary work on the part of the back end, and could also make Ninja back-end
response times much longer.

### Additional back-end serverless app

The additional back end is now in charge only of notifications. Whenever you assign a new object ID, the
"business logic" back end notifies the notification back end through an Azure Storage Queue message. Then,
the "notifications" back end reads the queue message and updates ins cache with the latest state of your app.

AL Object ID Ninja polls the "notification" back end every so often to check if there are any changes done by
your colleagues. If anyone working in the same app has assigned a new object ID, synchronized objects,
authorized or de-authorized the app, everyone else will get a notification message.

### More reliable authorization

Previous versions also suffered from authorization issues, theoretically allowing for a ten-minute window of
opportunity for wannabe hackers to hack into your object ID range without providing authorization key just
after an app was authorized. With this two-back-end setup, this is no longer possible.

All in all, with the new setup, notifications are adding less strain on the back end, they do not adversely
affect security, and they allow valuable and productive part of the solution to work with higher efficiency.

### Variable polling interval through a back-off algorithm

Polling mechanism now comes with an automatic back-off algorithm. Ninja will start polling the back end asking
for changes every 30 seconds. After two calls, if there is nothing new, it will start increasing the polling
interval gradually until it reaches 15 minutes. Therea

### News are included with regular polling interval

Finally, the notification polling mechanism is now handling news as well. Previously, news notifications were
polled with lower frequency. They are now coming through the same polling endpoint which means that they will
be as just-in-time as possible.

## User-name encryption

Previous versions of Ninja have included user name with `v1/getNext` endpoint invocations. This was used by the
notifications handler to be able to indicate the user name in the toast notification messages. However, since
this information was temporarily stored on in the Azure Blob Storage. Even though there was no public access to
this storage, information that was stored could be used to identify users, and as such Ninja was exposed to
GDPR liability.

With this version, user name is transmitted and stored in encrypted form using a symmetric password extrapolated
from the app ID. Since the app ID is never transmitted by Ninja, and the encrypted information can only be
decrypted by the information owner, but not by any party having physical access to data, this doesn't violate
any GDPR rules and protects your privacy.

Since there are no more privacy concerns, the option that prevents transmitting user name has been removed from
Ninja, and Ninja always sends the encrypted user name so that every developer in the team can receive full
notifications without any privacy concerns.

## Commands are prefixed `Ninja` instead of `Vjeko`

It made no sense that commands are prefixed with `Vjeko` for an extension that is called Ninja. Users are
accustomed to searching for commands by typing the extension name or moniker, and since there is no _"Vjeko"_ in
the extension name or description, it made far more sense to use `Ninja` instead.

The `Vjeko` prefix was set in the very early days of development before the name itself was determined, but it
was never changed later. Even though this is a breaking change, this was necessary.

## Less intrusive release notes

Previous versions have been designed to automatically show release notes documents (such as this one). This was
potentially intrusive as unsolicited windows would be automatically opened. Instead, new versions show a small
toast notification, and allow the user to choose whether to read the release notes or not.

In addition, release notes can now easily be accessed through a command in the Command Palette.
