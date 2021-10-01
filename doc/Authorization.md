# App Authorization in AL Object ID Ninja

AL Object ID Ninja is proud to be zero-configuration and immediately usable from the moment you install
it. However, for it to be able to reach this goal, it must share some information about your AL apps with a publicly
available API. You don't need to worry, this information is minimal, and anonymous. It includes your app ID and object
ID consumption information.

However, much the same way Ninja does that, anyone else can. Anyone who cares to inspect its source code can
promptly figure out how Ninja does that, and can call the same API endpoints by passing exact same information.
Long story short, a malicious user with access to your app ID, can mess up with your object ID assignment.

App authorization helps prevent this app ID hijacking.

## Why not making it truly secure?

You can't both have your cake and eat it. Either the app is zero-configuration and *just works*, or it is secure. You
cannot talk to a public API endpoint from an open-source app and have prevent anyone else from doing the same - with
the same app ID that you use

For this to work, there would have to be *some* configuration. You would have to register your account with Ninja
back end, then you would have to go through OAuth authentication occasionally to obtain a token. All in all, it would
not be zero-configuration anymore and it would take a lot of extra time to both get started and use it.

## Making it secure

This is where the *app authorization* feature comes to help. If you want to prevent malicious users from hijacking
your app ID, you can authorize your app.

When you authorize your app, the back end generates a unique key for that app, sends it to Ninja, and Ninja
then stores the key in the configuration file named `.objidconfig` in the root of your AL app repository.

This is an example of the authorization file:

![Authorization key example](./images/authorization-key.png)

Once your app is authorized, every request to the back end will include the key stored in that file. When the back
end receives a request for an authorized app, it will compare the key received with the request with the authorization
key it knows of, and if they don't match, it will refuse to process the request.

This is not military grade security, but is strong enough for a free utility that want's to be extremely simple to use.

## What do you do with the key?

When Ninja creates the authorization key file in your project root, you must make sure every team member has access to
it. The easiest way to share the key is to include it in your repository. That means: ***do not*** add it to
`.gitignore`.

Think of it like this: every member of your development team must use the same authorization key for the same app. The
key is also per app, and is directly bound to the app you are developing. It is useless for other apps. All of this
points to the fact that as long as your project repository is private (that is: not a public open-source repo), you
are going to be just fine.

## Making it even more secure

Another way of making it secure is to deploy your own back end. Seriously. The back end is open-source much like the
extension is. If you want to run it on your own infrastructure with your own Azure subscription, with your own security
in place, and you can configure Ninja to use your own endpoints:

![Configuration of own Azure function back end](./images/settings-own-back-end.png)

Here's the repository for the back end Azure function app that the public **AL Object ID Ninja** extension is
using: https://github.com/vjekob/al-objid/tree/master/azure-function-app

If you need help setting it up, I am always available.
