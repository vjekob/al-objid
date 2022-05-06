# Auto-Syncing Dirty Repositories

Automatic synching of IDs in a (typically multi-root) workspace involves identifying all Git repositories and
branches, and then checking out into each branch. This process is non-destructive, it doesn't change contents
of your repositories, and after it finishes it leaves your repository exactly where it found it, checked out
to exactly the same branch.

However, in order to successfully perform this process, your repository must not have any dirty or staged
contents when you start automatic synchronization. Since checking out into a dirty repository may result in
content conflicts, Git may fail at performing it. To avoid this situation and having to guess how you would
want to synchronize IDs if Git doesn't successfully check out into each branch, AL Object ID Ninja will not
enter into auto-synchronization process when you have dirty or staged files.

## Resolving the issue

Before starting automatic synchronization, please do one of the following:

1. Stash all contents. This will clean up your working directory and your Git index (staging area). You will
   want to do this if the dirty or staged contents are not relevant for object ID synchronization, and you want
   to continue developing them after synchronization completes. Once synchronization is finished, simply pop the
   last stash and continue where you left off.
2. Commit all contents. If the dirty or staged contents are relevant for synchronization (they include object
   IDs that you want to include in the synchronization), then the best way to proceed is to just commit what you
   have and synchronize from there. Then, after synchronization finishes, you can easily revert the last commit
   you made by typing `git reset HEAD~1` in command line to get the contents of your last commit back into your
   working directory.
3. Clean the working directory. If the dirty or staged contents are not relevant for synchronization and you
   do not want to continue developing from them, then the best way to proceed is to reject your changes and get
   your working directory clean again.
