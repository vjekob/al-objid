# Authorization and Git

If you are not sure what authorization is, then please read this document:
https://github.com/vjekob/al-objid/blob/master/doc/Authorization.md

When you authorize an app, Ninja generates the `.objidconfig` file. This file contains the
authorization key for your app. This file is sensitive and must not be lost. If you authorize
an app, and then lose the key file, you won't be able to use Ninja to assign object IDs anymore.

Ninja will automatically commit this file to Git for you, to make sure - as much as it is
reasonably possible - that you do not accidentally lose this file.

# How does authorization work with Git?

Before you authorize the app, your repository must be clean. Ninja requires this so that it can
make sure that the authorization file is always committed to your repository. If your repository
is dirty, Ninja would not be able to commit just the `.objidconfig` file.

This is what happens during authorization:

-   Ninja will first ask (twice) for your confirmation. Ninja wants to be sure you know what you are
    doing when you are authorizing an app.
-   Then, Ninja will check if the repository is clean. If there are uncommitted modifications in your
    repository, either in your working directory or staging area, you must clean them before authorizing
    the app.
-   When repository is clean, Ninja will check which branch you are on. It will ask you whether you
    are sure to commit `.objidconfig` to that branch. This is to prevent accidental commits to your main
    branch when you are not doing trunk-based development (in which case committing to master locally
    could cause problems).
-   When you confirm the branch to commit to, Ninja will proceed with authorization. It will send the
    authorization request to the back end, and when it receives the authorization key response, it will
    store the key in the `.objidconfig` file.
-   When `.objidconfig` file is written, Ninja will immediately stage it, then commit it.

After your app is authorized, Ninja will monitor your `.objidconfig` file for you and it will make
sure that you do not accidentally delete it. It will make an honest attempt to detect the difference
between you deleting the file, and for example switching to a branch that doesn't (yet) include this
file. In short, Ninja will go to great lenghts to make sure you never lose this file.
