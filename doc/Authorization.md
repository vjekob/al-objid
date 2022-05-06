# App Authorization in AL Object ID Ninja

AL Object ID Ninja is proud to be zero-configuration and immediately usable from the moment you install
it. However, for it to be able to reach this goal, it must share some information about your AL apps with a publicly
available API. You don't need to worry, this information is minimal, and anonymous. It includes your app ID and object
ID consumption information.

However, just like Ninja can call this public API, anyone else can. Anyone who cares to inspect its source code can
promptly figure out how Ninja does that, and can call the same API endpoints by passing exact same information.

Since AL Object ID Ninja works on public infrastructure, a malicious person who knows your app ID
could consume all your available IDs, and make it impossible for you to use Ninja to manage your
object IDs. There is very little to gain from this kind of activity, but since it's possible,
Ninja prefers adopting the _better safe than sorry_ strategy.

Consider these two facts:

- When you publish your app to AppSource, your app ID becomes public. Anyone can use this information
  to mess with your object ID assignment.
- Ninja has already been attacked this way! For whatever reason, there were people who have used
  third-party app ID to make it impossible for their competitors to use Ninja. Strange world, this is.

App authorization helps prevent this kind of app ID hijacking.

## Why not making it truly secure?

You can't both have your cake and eat it. Either the app is zero-configuration and _just works_, or it is secure. You
cannot talk to a public API endpoint from an open-source app and prevent anyone else from doing the same - with
the same app ID that you use

For this to work, there would have to be _some_ configuration. You would have to register your account with Ninja
back end, then you would have to go through OAuth authentication occasionally to obtain a token. All in all, it would
not be zero-configuration anymore and it would take a lot of extra time to both get started and use it.

## Making it secure

This is where the _app authorization_ feature comes to help. If you want to prevent malicious users from hijacking
your app ID, you can authorize your app.

When you authorize your app, the back end generates a unique key for that app, sends it to Ninja, and Ninja
then stores the key in the configuration file named `.objidconfig` in the root of your AL app repository.

This is an example of the authorization file:

![Authorization key example](./images/authorization-key.png)

Once your app is authorized, every request to the back end will include the key stored in that file. When the back
end receives a request for an authorized app, it will compare the key received with the request with the authorization
key it knows of, and if they don't match, it will refuse to process the request.

This is not military grade security, but is strong enough for a free utility that aims to be zero-configuration and
extremely simple to use.

## What do you I with the key?

When Ninja creates the authorization key file in your project root, you must make sure every team member has access to
it. The easiest way to share the key is to include it in your repository. That means: **_do not_** add it to
`.gitignore`.

Think of it like this: every member of your development team must use the same authorization key for the same app. The
key is also per app, and is directly bound to the app you are developing. It is useless for other apps. All of this
points to the fact that as long as your project repository is private (that is: not a public open-source repo), you
are going to be just fine.

## What happens if I lose the key?

If you lose the key for an app, then **you won't be able to assign object IDs using Ninja for that app anymore.**
This means: keep the key file safe.

## What does Ninja do to safeguard my key?

Ninja goes to great length with protecting your key:

- You can only authorize an app when your local repository is clean. That means - no pending changes in your
  working directory or your staging area.
- When you authorize an app, Ninja will automatically commit the authorization key. It won't push your local
  branch to remote, but it will remind you to do that.
- If you delete the key file while Ninja is running, Ninja will immediately warn you.

All in all, when you authorize the app, and then let Ninja manage the key file (as opposed to you manually
doing anything with it), you are safe.

## But I don't like random files in my root

We've heard this complaint. _"I want my root to be clean, and I take pride in my repo being nicely organized. All
source files are in the `src` directory, and my root contains only `app.json` because it has to be there. Now I have this strange `.objidconfig` file and I don't really like it."_

People who complain about this are people who have only used VS Code to develop in AL. For all other languages, it
is normal for the tools to put their stuff into root. Typescript, Node.js, C#, Babel, Angular, are just a few out of
hundreds of examples. In VS Code, configuration files that belong to repository, and that are important for all
developers on the team, belong in root. Ninja does not do anything different than all those other tools.

There were other options, of course. However, nothing else allows Ninja to just work, without any configuration.

Keep in mind: every developer in your team can just clone the repository and start working immediately without having
to do anything else at all. Ninja is that simple, and it wants to stay that simple. That's why the `.objidconfig` file
resides in the root.

Maybe, if at some point Microsoft makes `app.json` extensible, the way that - for example - `package.json` is
extensible for Node.js does, then Ninja will store the authorization key in there. Until this happens, the key stays
in `.objidconfig`.

## Making it even more secure

Another way of making it secure is to deploy your own back end. Seriously. The back end is open-source much like the
extension is. If you want to run it on your own infrastructure with your own Azure subscription, with your own security
in place, and you can configure Ninja to use your own endpoints:

![Configuration of own Azure function back end](./images/settings-own-back-end.png)

Here's the repository for the back end Azure function app that the public **AL Object ID Ninja** extension is
using: https://github.com/vjekob/al-objid/tree/master/azure-function-app

If you need help setting it up, I am always available.
