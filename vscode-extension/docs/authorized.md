# Your app is now authorized

**PLEASE, READ THIS DOCUMENT CAREFULLY.**

**YES, READ IT, PLEASE, WE REALLY MEAN IT.**

We have created a small file named `.objidconfig` in the root of your app, right next to your `app.json`. This file **is important**, it **IS NOT** an accidental leftover artifact of the authorization procedure that we just happened to forget to delete. No, this file **IS IMPORTANT**. **REALLY, REALLY, _REALLY_ IMPORTANT.**

Think of this file as your team's per-app AL Object ID Ninja password.

**KEEP THIS FILE SAFE.** To help you with this, we made sure it's now committed to your (local) repository. Please make sure to push this file to remote and integrate it to your main branch as soon as possible.

Other developers on your team now need access to this file. Without access to this file, AL Object ID Ninja is unable to assign object IDs for your app. **THIS IS NOT A BUG! THIS IS THE GOAL OF AUTHORIZATION.** The authorization makes sure that people who are unauthorized cannot assign object IDs in your app. And authorized means having access to this file.

**DO NOT DELETE THIS FILE. DO NOT MODIFY THE VALUE OF THE `authKey` PROPERTY IN THIS FILE MANUALLY. DOING ANY OF THESE THINGS WILL MAKE IT IMPOSSIBLE FOR YOU TO ASSIGN ANY OBJECT IDS FOR THIS APP, EVER. IT'S THE SAME AS FORGETTING THE PIN OF YOUR BANK CARD OR LOSING THE KEY TO YOUR HOME.**
