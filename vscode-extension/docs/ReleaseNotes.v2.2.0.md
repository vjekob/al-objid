# Release Notes for AL Object ID Ninja version 2.2.0

Welcome to AL Object ID Ninja version 2.2.0! This is the first update in a long while, but that's only because the
features introduced in this version required deep changes in both the Visual Studio Code extension and the Azure
back end.

> **_IMPORTANT:_** If you are using a private back end, please make sure to update it. The changes introduced with
> this version will not work with the previous version of the back end. Old features will continue working unaffected,
> but to take advantage of the new features, you also need the latest back end.

## What's New

-   You can now assign field IDs and enum value IDs
-   AL Object ID Ninja uses a new, much faster and more accurate AL parser
-   Several minor updates and fixes are introduced

That's it in brief notes. If you want to know more details, read on.

## Field IDs assignment

You can assign field IDs for tables (and table extensions) much the same way you can assign object IDs:

![Assigning field IDs](https://raw.github.com/vjekob/al-objid/master/doc/images/field_ids.gif)

When assigning field IDs, AL Object ID Ninja will automatically suggest a semicolon when there is no semicolon after
the current cursor position. This is to match the built-in experience of AL Language extension that does the same.

## Value IDs assignment

Unlike with AL Language extension, AL Object ID Ninja can auto-suggest value IDs for enums and enum extensions.

![Assigning enum value IDs](https://raw.github.com/vjekob/al-objid/master/doc/images/value_ids.gif)

> **_IMPORTANT:_** If you have already used AL Object ID Ninja with existing apps, you will have to synchronize all
> IDs with **Replace** option once again to be able to assign field IDs and enum value IDs correctly.

## New AL Language parser

Earlier versions of AL Object ID Ninja have used a special parser that was capable of detecting object IDs with
high level of accuracy very fast. However, that parser was only capable of handling object IDs, but wasn't able
to parse the contents of objects, such as field IDs or enum values.

To be able to support field IDs and enum value IDs, AL Object ID Ninja needed a new parser, that had to be able
to correctly identify the field and value context, especially when assigning new IDs. So, a completely new parser
was developed, that will soon be available as a stand-alone product at [@vjeko.com/al-parser-node](https://www.npmjs.com/package/@vjeko.com/al-parser-node).

The new parser is both much faster and more accurate than the previous version, and is capable of extracting
object IDs, field IDs, and enum values IDs from several thousand files in a fraction of a second.

![Performance of new parser](https://raw.github.com/vjekob/al-objid/master/doc/images/new_parser_performance.gif)
