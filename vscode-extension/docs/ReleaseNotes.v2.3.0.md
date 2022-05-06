# Release Notes for AL Object ID Ninja version 2.3.0

Welcome to AL Object ID Ninja version 2.3.0!

## What's New

-   No communication with back end for non-managed apps
-   Authorization process is more robust and reliable
-   Output logging is improved
-   A few minor bugs and fixes are introduced

That's it in brief notes. If you want to know more details, read on.

## No communication with back end for non-managed apps

An AL app is managed if it uses Ninja to assign object IDs. No app is managed by default unless the user
explicitly clicks **Yes** when first asked if Ninja should manage object ID assignment for that app.

However, even for non-managed apps, Ninja used to send a lot of back-end calls. For example, telemetry
calls were sent for all telemetry, app authorization was checked, and - most importantly - polling calls
were placed (to check if other users did something with the app).

From version 2.3.0, Ninja will check for each app if it's managed before it does anything. For non-managed
apps no calls will be placed to the back end until the app becomes managed. No polling calls will be
placed, and no telemetry call (except starting app signal) will be placed.

The upside is that with reduced number of calls to the back end by users who do not use Ninja to assign
object IDs, the performance is slightly improved for those users who actually use Ninja to manage their
object ID assignment.

## More robust authorization process

Authorization process is now more robust and less likely to result in lost authorization keys. The improved
authorization process looks like this:

1. Only apps with Git source control can be authorized. This is to make sure that after authorization the
   authorization key (`.objidconfig` file) is not accidentally lost.
2. Authorization (and deauthorization) can only be performed on a clean repository. This is to make sure that
   the authorization key is committed in a single commit without any delay between authorizing and committing.
3. User is asked for two more confirmations. The first additional confirmation happens immediately after the
   process starts, and asks if the user really knows what they are doing. This is to make it harder for users to
   accidentally authorize an app. The second additional confirmation happens just after Git prerequisites are
   checked, and asks the user to confirm the name of the branch on which to commit. this is to make sure that the
   authorization file is committed on a branch that will not interfere with the branching model, so that it can
   be integrated into the repository as soon as possible. This also prevents accidental commits to master when
   such commits are not allowed (which seems to be the case with majority of AL workspaces out there).
4. After authorization (or deauthorization) completes, Ninja immediately commits the authorization file and
   shows a short informational document to explain what has just happened. This is to make sure that the user
   is aware of the presence of the `.objidconfig` file. In the past, some users have deleted the `.objidconfig`
   file immediately after authorizing, thinking that the file is some leftover artifact from the authorization
   process that can safely be deleted (even though the contents of the file explicitly asked users not to
   delete that file).
5. Throughout the process, whenever some precondition isn't met, the user has the **Learn more** button that
   opens the relevant documentation page and explains what's going on and why. This is to make sure that users
   don't blindly go through the authorization process without understanding the consequences.

On top of this, there are several other improvements of how authorization key is handled afterwards:

-   Ninja monitors the `.objidconfig` file. Whenever the file is deleted, Ninja checks if that deletion was
    a consequence of Git branch changing (for example, switching from a branch that includes `.objidconfig` to
    a branch that doesn't) or it was actually deleted as a direct user action. Then, if it was a consequence of
    branch changing, Ninja warns the user of the fact that there is no authorization file and that it won't be
    able to assign object IDs until `.objidconfig` is merged from the branch that contains it. Also, if deletion
    of the file was a consequence of direct user action, Ninja will show an error and ask the user to immediately
    roll back that operation. All of this is to make sure that people do not accidentally delete the `.objidconfig`
    file.
-   Authorization stores information about the user who last authorized the app, and shows this information in
    the tooltip of the **Authorized** section in the status bar. Also, if the authorization is invalid (for
    example, the app is authorized, but the `.objidconfig` file is missing) status bar section will state that
    the app has **Invalid authorization** (and will also show the name of the user who authorized the app). All
    this is to make sure that users own up to their actions. In the past, some users have first authorized their
    app, then deleted the `.objidconfig`, and then when the team leads investigated who caused their apps to not
    be able to use Ninja, nobody came forward, and the situation was blamed on "some bug by Ninja". Now that will
    not be possible anymore, because it takes quite a ceremony to authorize an app, and after an app is authorized
    the name of the authorizer is made known to everyone. No way anyone can claim "I didn't do it" if they
    authorize the app, and then delete the `.objidconfig` file despite all the warnings and signals from the Ninja
    that it's not a safe thing to do.

## Improved output logging

Previous versions only had verbose level logging, meaning that you either saw a very detailed output logs
with a lot of irrelevant information, or you saw no output log at all. Now, the important messages are
logged always, and only less important messages are logged at verbose level.
