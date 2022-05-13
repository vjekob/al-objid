# YOU SEEM TO HAVE CHANGED THE APP ID IN THE `app.json` MANIFEST FILE

AL Object ID Ninja thinks that you have just changed your app `id` in the `app.json` file.

This would not be a problem if your app wasn't authorized with Ninja. After you change your
app `id`, your existing authorization key will no longer work.

**If this is the case, then please undo this operation as soon as possible!**

If you think this is a false alarm then please ignore this message. Still, we think it's not a
false alarm.

# So, you changed the app `id`, what now?

You should try one of these options:

1. Undo your change. Manually changing app `id` is probably not a good idea anyway.
2. If you are sure you want to retain your new `id`, then clear the invalid authorization key
   property in your `.objidconfig`. Simply delete the `authKey` property, or set it to `""`.
3. If the previous step didn't help, then it means you have changed your app `id` to a value
   already in use by another authorized app. If this is the case, you have these two choices:

-   Contact the owner of the app whose `id` you have just configured (you probably know who
    that is, since you used an existing app `id`) and ask for the configuration key. Then
    configure that key in `.objidconfig`.
-   Change your app `id` to a different value.
