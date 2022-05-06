# Release Notes for AL Object ID Ninja version 2.4.0

Welcome to AL Object ID Ninja version 2.4.0!

## What's New

-   Suggest multiple object IDs in multi-range app

That's it in brief notes. If you want to know more details, read on.

## Suggest multiple object IDs in multi-range app

This new feature allows you to assign an object ID from an explicit range. For example, you may have
preferred IDs for specific functional areas of your app (the way Microsoft's Base App does it). In
any scenario where this is preferable, Ninja can now suggest a new ID from each range where a new ID
is available.

For example, if you have these ranges:

```JSON
{
    "idRanges": [
        {
            "from": 50000,
            "to": 50099
        },
        {
            "from": 60000,
            "to": 60999
        }
    ]
}
```

Then Ninja can suggest these IDs:
![Assigning IDs from multiple ranges](https://github.com/vjekob/al-objid/blob/master/doc/images/suggest-multiple-ranges.gif?raw=true)

To turn on this feature, you must set the `"objectIdNinja.requestPerRange"` configuration setting to `true`.

> The `"objectIdNinja.requestPerRange"` setting is just like any other configuration setting in VS Code: you can set it per folder, per workspace, or per user. It is best to set it per workspace or per folder.
