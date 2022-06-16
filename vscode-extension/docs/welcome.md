# AL Object ID Ninja

Welcome to AL Object ID Ninja!

This extension manages object IDs in multi-developer environments with mind-boggling simplicity.
Never again find yourself resolving another object ID collision when your pull request was too
late and another developer "hijacked" your IDs.

## What does it do?

It auto-suggest next available object ID through IntelliSense:

![IntelliSense auto-suggestion of next available ID](https://raw.githubusercontent.com/vjekob/al-objid/master/doc/images/intellisense-2.gif)

## How is this different from what AL already does?

There is a big difference. AL Object ID Ninja is aware of object IDs assigned by every
developer in your team **before anyone even commits**. With AL Object ID Ninja you will
never assign a conflicting object ID to new objects you create.

AL Language compiler only ever looks at your local repo and It doesn't see object IDs
assigned to new objects by other developers in their local repos, nor it shows to other
developers object IDs you assigned.

> AL Object ID Ninja **does not** replace object ID suggestions made by the AL Language.
> Instead, it puts its suggestions on top of the suggestion list, right above Microsoft's suggestions. If you want to accept AL Object ID Ninja's suggestion, make sure to pick
> the first auto-suggested object ID, not the second one!

## How do I get started? Is there any setup?

AL Object ID Ninja works out of the box, no need to set up or configure anything. The
only thing you need to do is synchronize it once for each AL app you want to use it with.
The first time you invoke IntelliSense to suggest you an object ID, AL Object ID Ninja
will notify you. Just click `Synchronize` and you are good to go.

![Synchronizing for the first time](https://github.com/vjekob/al-objid/blob/master/doc/images/getting-started-2.gif?raw=true)

## That's it?

That's it! Seriously. It's that simple. Once AL Object ID Ninja is active, you can forget
your object ID problems. Just focus on your development without ever worrying about object
IDs.

If you want to read more about the features and how it works, check the [AL Object ID
Ninja](https://marketplace.visualstudio.com/items?itemName=vjeko.vjeko-al-objid)
page on Visual Studio Code Marketplace.
