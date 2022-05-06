# Release Notes for AL Object ID Ninja version 2.5.0

Welcome to AL Object ID Ninja version 2.5.0!

## What's New?

This version brings a lot of exciting new features:

-   App pools feature to share same object ID ranges between multiple apps
-   License validation to check your object ID assignments against a (customer) license
-   Logical ranges to help you manage object ID assignments with more granularity and control

There are also a few minor updates and changes:

-   Including user name in back-end operations is (again) optional
-   Authorization and deauthorization work better in multi-root workspaces
-   Validation of `.objidconfig` file
-   Improved AL Object ID Ninja extension activation

That's the bullet points. Read on to get more insight into these features and improvements.

## App Pools

Application pools is a new feature that allows multiple apps share the same consumption information
about object IDs. Once you consume an object ID from one app, it immediately becomes unavailable for
assignment in any other app belonging to the same pool.

There are several scenarios where application pools are not just preferable, but indispensable:

-   Splitting one large partner range across multiple partner apps, especially for legacy apps.
-   Multiple PTE (per-tenant extensions) for the same customer absolutely must cause no ID conflict, but
    without application pools it's practically impossible to make sure all IDs are unique across all PTEs.

To learn more about app pool, check out the [Application Pools documentation page](https://github.com/vjekob/al-objid/blob/master/vscode-extension/docs/app-pools.md)
on GitHub.

## License Validation

License validation allows you to validate your app against a BC license file (typically a customer
license). The validation will check all your object IDs and check whether those object IDs are
available in the license file. Any object IDs that are not assigned in the license file will be
reported in the `Problems` window and indicated in the source code.

![License problem](https://github.com/vjekob/al-objid/blob/master/doc/images/license-problem.png?raw=true)

Learn more about this feature from the [License Validation documentation page](https://github.com/vjekob/al-objid/blob/master/vscode-extension/docs/validate-license.md)
on GitHub.

## Logical Ranges

Logical ranges allow you to split or redistribute your ID ranges so that object ID assignment is not
simply picking the first available ID, but the first available ID in the functional area you want.

When you declare logical ranges in your `.objidconfig` configuration file, every time you request a new
object ID, you will see multiple ID suggestions, one per range:

![Suggesting from logical ranges](https://github.com/vjekob/al-objid/blob/master/doc/images/suggest-logical-ranges.gif?raw=true)

## Including or Excluding User Name from Back-End Operations

When communicating with the back end for certain operations, such as assigning a new ID, authorizing
an app, or synchronizing the objects, Ninja sends user information to the back end. This information
is useful because it allows Ninja to notify all users in a workspace when an important event takes
place.

While this information is encrypted, and cannot be read by anyone who doesn't have access to your app
ID, some users have expressed privacy concerns over the fact that user name is sent to the back end
in any form.

Original version of Ninja had an option to control whether user name is shared with the back end, but
when this information was encrypted (in v2.0.1) this configuration option was removed.

Now, the `objectIdNinja.includeUserName` option is back, and you can use it to switch off user name
sharing with the back end. This should keep your lawyers happy.

## Multi-root Authorization and Deauthorization

Authorization and deauthorization workflows are improved and can now handle multiple roots (apps) in
a multi-root workspaces to authorize/de-authorize multiple apps in one go.

## Validation of `.objidcofig` File

This version brings a lot of new functionality to the `.objidconfig` configuration file, and there
are many scenarios in which users will modify this file manually.

This file is no longer just a dummy JSON file that stores configuration settings, but is live and
interactive, and it notifies you whenever you make a manual configuration change that is invalid.

## Improved AL Object ID Ninja Activation

Previously, Ninja pushed all its commands into VS Code and you were able to call any of them even
if you are not working in an AL workspace. This could result in runtime errors that are difficult
to interpret for most of users.

Ninja is now activated only in these circumstances:

-   You are actually working in an AL project
-   Your workspace contains the `.objidconfig` file

Furthermore, Ninja will now also activate the AL extension automatically if it itself gets activated
by the presence of the `.objidconfig` file. This allows you to open VS Code and start invoking AL
commands without actually having to open an AL file first.
