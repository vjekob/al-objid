# Logical Ranges

Your `app.json` application manifest defines `idRanges` that are available for your app. These ranges
specify possible object ID values, and AL Language will refuse to compile an app that uses an object
ID that falls outside of ranges specified there.

For example, your `app.json` may define a single range from 50000 to 59999. If this is the case, both
AL Language and AL Object ID Ninja will always suggest the first known available ID for any new object.
However, most apps have more than one logical functional area, and most developers prefer assigning
ranges that allow grouping of objects into those functional areas. For example, you may prefer some
logical split of your wide app range into multiple logical ranges, and you may want to assign IDs from
50000 to 50099 to Sales customizations, 50100 to 50199 to Purchase customizations, and 50200 to 59999
for other functionality.

This is where logical ranges come into picture. AL Object ID Ninja allows you to define logical ranges
and then suggest IDs per logical range.

## How to define logical ranges

To define logical ranges, you use the `.objidconfig` configuration file. In that file, you can declare
the `idRanges` section where you can declare ranges much like you would do in the `app.json` application
manifest. However, apart from simply declaring logical ranges in there, you can also provide a
_description_ for each range, which then shows in the AL Object ID Ninja **Range Explorer** view as
well as in IntelliSense autosuggest drop-down list.

This is an example of an `.objidconfig` configuration file that declares logical ranges:

```JSON
{
  //You can customize and describe your logical ranges here
  "idRanges": [
    {
      "from": 50100,
      "to": 50109,
      "description": "Customer range"
    },
    {
      "from": 60000,
      "to": 60099,
      "description": "Finance"
    },
    {
      "from": 60100,
      "to": 60199,
      "description": "Sales"
    },
    {
      "from": 60200,
      "to": 60299,
      "description": "Purchases"
    },
    {
      "from": 61000,
      "to": 69999,
      "description": "Other"
    }
  ]
}
```

## Multiple number ranges per logical range

A logical range is not just a single range of numbers delimited by `from` and `to` but encompasses all
number ranges with the same `description` property. For example, the configuration below represents a
single logical range:

```JSON
    {
      "from": 60100,
      "to": 60199,
      "description": "Sales"
    },
    {
      "from": 60550,
      "to": 60599,
      "description": "Sales"
    }
```

This matters when assigning new numbers, because IntelliSense will auto-suggest only one number for
the `Sales` logical range, it will not offer two numbers from two different number ranges. This allows
for great flexibility when defining ranges and does not limit you to a single numeric range.

## Logical ranges per object type

Logical ranges defined in the `idRanges` property are general and apply to all object types. However,
you can specify an explicit object type range. For example, you can have "Sales", "Purchases", and
"Finances" as logical ranges for all object types, except for XmlPorts, where you have "Import", "Export",
and "Integration"

To define per-object logical ranges, use the `objectRanges` property, like this:

```JSON
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
      }
    ]
  }
```

In this example setup, XMLports and pages have explicit object ranges, and assigning values to those
types of objects will use the ranges defined in here.

## Using logical ranges

When you declare logical ranges in your `.objidconfig` configuration file, every time you request a new
object ID, you will see multiple ID suggestions, one per range:

![Suggesting from logical ranges](https://github.com/vjekob/al-objid/blob/master/doc/images/suggest-logical-ranges.gif?raw=true)

> Please note: When your `.objidconfig` configuration file defines at least one logical range in the
> `idRanges` property, then AL Object ID Ninja will **always** suggest IDs per range, regardless of the
> `objectIdNinja.requestPerRange` setting. **Logical ranges declared in `.objidconfig` always take
> precendent over your VS Code User or Workspace settings.**

## How number assignment works when logical ranges are used

Ninja assigns new numbers in a two-step process: first, you request the next number auto-suggestion which
is shown in your IntelliSense auto-suggest drop-down list; and second, when you accept the auto-suggestion
by selecting the number from auto-suggest drop-down list. Until one user selects the auto-suggested next
ID, multiple users may see the same suggested number, but Ninja makes sure that each user receives a
unique new object ID when they complete the auto-suggestion by selecting the suggested number in the list.
In a multi-user scenario, this is what it looks like:

![Number assignment in multi-user scenario](https://github.com/vjekob/al-objid/blob/master/doc/images/assigning-id-multiuser.gif?raw=true)

When you don't have logical ranges (and when Ninja is configured not to request new IDs per range), then
Ninja will propose a single next ID which is always the lowest unused ID from the ranges defined in your
`app.json`. Without logical ranges, Ninja will consider all ID ranges defined in `app.json` as equal, and
when one range is consumed, it will suggest the next number from the next free range.

However, when you have logical ranges, and you accept the auto-suggested ID from the drop-down list, then
Ninja will require the next ID to actually be assigned from the range you selected. If that range happens
to be fully consumed at the moment you accept the suggestion, then Ninja will not be able to suggest the
next number.

For example, consider this scenario. You have two logical ranges, Sales (50000..50099) and `Purchases`
(50100..50199). You want to assign a new number and Ninja offers two choices:

![Two suggestions](https://github.com/vjekob/al-objid/blob/master/doc/images/logical-ranges-example1.png?raw=true)

Imagine that at the same time you are creating your new codeunit, another developer on your team is also
creating a new codeunit and wants to assign its number from the Sales logical range. Both of you will see
exactly the same suggestions for Sales and Purchase ranges. If the other user selects the Sales range,
they will consume the last available number in the Sales range (50099). If you now also accept the Sales
range, Ninja will not assign any number to your object, and will behave as if there are no more numbers
avaiable.

> Keep in mind: Ninja will always respect your logical range choice when assigning a new number, and will
> never assign a new number from a different logical range than the one you selected when accepting an ID
> suggested by Ninja.

## Copying ranges from `app.json` to `.objidconfig`

Often, you'll want to start with exact same ranges in your `.objidconfig` as you have in your `app.json`.
To help you kick-start your logical range definitions, you can use the `Ninja: Copy ranges from app.json to .objidconfig` command:

![Copying ranges to .objidconfig](https://github.com/vjekob/al-objid/blob/master/doc/images/copy-ranges.gif?raw=true)

## Ordering logical ranges

The order of logical ranges declared in the `.objidconfig` file is the order in which suggestions are
ordered in the IntelliSense auto-suggest drop-down list, as well as in the Range Explorer view. If you
want to prioritize certain ranges on top of others, then you should list those ranges first. For example:

```JSON
{
  //You can customize and describe your logical ranges here
  "idRanges": [
    {
      "from": 60000,
      "to": 60099,
      "description": "Finance"
    },
    {
      "from": 60100,
      "to": 60199,
      "description": "Sales"
    },
    {
      "from": 60200,
      "to": 60299,
      "description": "Purchases"
    },
    {
      "from": 50100,
      "to": 50109,
      "description": "Customer range"
    },
    {
      "from": 61000,
      "to": 69999,
      "description": "Other"
    }
  ]
}
```

The configuration above will make sure that suggestions are first shown for the _Finance_ range, then for
the _Sales_ range, then for the _Purchases_ range, then for the _Customer range_ range (even though that
range is numerically the first one), and finally the _Other_ range.

> Note: Changing order of ranges in the `.objidconfig` file will reflect immediately on the IntelliSense
> auto-suggest drop-down list, but not for the Range Explorer view. To reflect changes to ranges in the
> Range Explorer view, you must restart VS Code.

## Consolidating logical ranges

It is possible that logical ranges defined in `.objidconfig` get out of sync. For example, you can edit
the original ranges in `.objidconfig` manually, or you could add more ranges or change existing ranges in
`app.json`. If this happens, not all IDs avaialble through `app.json` will be assignable by Ninja.

To fix the problem, you can use the `Ninja: Consolidate logical ranges` command.

For example, if these are ranges defined in `app.json`:

```JSON
"idRanges": [
  {
    "from": 50100,
    "to": 50109
  },
  {
    "from": 60000,
    "to": 70000
  }
]
```

... and these are defined in `.objidconfig`:

```JSON
"idRanges": [
  {
    "from": 60000,
    "to": 60099,
    "description": "Finance"
  },
  {
    "from": 60100,
    "to": 60199,
    "description": "Sales"
  },
  {
    "from": 60200,
    "to": 60299,
    "description": "Purchases"
  },
  {
    "from": 50100,
    "to": 50109,
    "description": "Customer range"
  },
  {
    "from": 60350,
    "to": 60799,
    "description": "Random customizations"
  }
]
```

Then running the `Ninja: Consolidate logical ranges` command will result in these additional ranges
defined in `.objidconfig`:

```JSON
{
  "from": 60300,
  "to": 60349,
  "description": "Free range #1"
},
{
  "from": 60800,
  "to": 70000,
  "description": "Free range #2"
}
```

> Note: Consolidating ranges will try to keep the original order of logical ranges. However, if you have
> two logical ranges with the same name, it may not end up with the same order. For example, if you have two
> logical ranges named _Sales_ and one logical range _Purchase_ defined in between two _Sales_ ranges, then
> consolidation will order two _Sales_ ranges together, and then the _Purhcase_ range after them. If you want
> to retain the exact same original range ordering in scenarios like this, you'll have to move ranges later
> manually.
