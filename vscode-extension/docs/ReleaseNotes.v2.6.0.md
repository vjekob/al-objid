# Release Notes for AL Object ID Ninja version 2.6.0

Welcome to AL Object ID Ninja version 2.6.0!

## What's New?

This version adds a few things:

-   Logical ranges per object type
-   Code actions to help fixing most some `.objidconfig` issues

That's it. If you want to know more, read on.

## Logical ranges per object type:

Logical ranges now offer a lot more flexibility. You can define different logical ranges for different
object types. For example, you can have "Sales", "Purchases", and "Finances" as logical ranges for all
object types, except for XmlPorts, where you have "Import", "Export", and "Integration".

Here's an example of different logical ranges per object type:

```JSON
  "idRanges": [
    {
      "from": 50000,
      "to": 50099,
      "description": "Sales"
    },
    {
      "from": 50100,
      "to": 50199,
      "description": "Purchases"
    }
  ],
  "objectRanges": {
    "xmlport": [
      {
        "from": 50000,
        "to": 50049,
        "description": "Import"
      },
      {
        "from": 50050,
        "to": 50099,
        "description": "Export"
      }
    ],
    "page": [
      {
        "from": 50000,
        "to": 50199,
        "description": "Sales"
      },
      {
        "from": 50200,
        "to": 50399,
        "description": "Purchases"
      },
      {
        "from": 50400,
        "to": 50445,
        "description": "APIs"
      }
    ]
  }
```

If you want to learn more, check out the documentation: [Logical Ranges](https://github.com/vjekob/al-objid/blob/master/vscode-extension/docs/logical-ranges.md)

## Code Actions in `.objidconfig`

Some problems reported about the `.objidconfig` file can now be fixed through code actions. For example,
you can easily resove a problem of incorrect license file:

![Select license file](https://github.com/vjekob/al-objid/blob/master/doc/images/objidconfig-code-actions.gif?raw=true)

Incorrect object type specification for a per-object-type logical range can also be fixed using code
actions: you can delete the entire invalid specification, or you can simply switch an incorrect object
type with a correct one from a quick pick list.
