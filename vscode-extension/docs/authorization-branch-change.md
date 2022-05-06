# Branches with invalid authorization

You seem to have switched to a branch that has invalid authorization key file.

Typically, apps are authorized once, and then the authorization file is committed and never
changed again.

However, sometimes it's possible that after an app is authorized, it gets deauthorized and then
authorized again. When this happens, the back end will issue a new authorization key. When this
key is committed, there is a theoretical possibility that there are other branches that still
contain the old authorization key file.

**You seem to be in this situation now**

# What do I do?

Since you are on a branch that contains an invalid authorization key, the best course of action
for you is this:

1. Immediately switch back to the branch you worked on before.
2. Open the `.objidconfig` file and copy its contents.
3. Switch back to the branch that contains the invalid file.
4. Open the `.objidconfig` file and paste the copied contents.
5. Safe the file, commit it to the branch.
6. If your branch has been pushed to remote, push it again to make sure all other developers get
   your change as soon as possible.
