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
*description* for each range, which then shows in the AL Object ID Ninja **Range Explorer** view as
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

## Using logical ranges

When you declare logical ranges in your `.objidconfig` configuration file, every time you request a new
object ID, you will see multiple ID suggestions, one per range:

![Suggesting from logical ranges](https://github.com/vjekob/al-objid/blob/master/doc/images/suggest-logical-ranges.gif?raw=true)

> Please note: When your `.objidconfig` configuration file defines at least one logical range in the
`idRanges` property, then AL Object ID Ninja will **always** suggest IDs per range, regardless of the
`objectIdNinja.requestPerRange` setting. **Logical ranges declared in `.objidconfig` always take
precendent over your VS Code User or Workspace settings.**

## Copying ranges from `app.json` to `.objidconfig`

Often, you'll want to start with exact same ranges in your `.objidconfig` as you have in your `app.json`.
To help you kick-start your logical range definitions, you can use the `Ninja: Copy ranges from app.json to
.objidconfig` command:

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

The configuration above will make sure that suggestions are first shown for the *Finance* range, then for
the *Sales* range, then for the *Purchases* range, then for the *Customer range* range (even though that
range is numerically the first one), and finally the *Other* range.

> Note: Changing order of ranges in the `.objidconfig` file will reflect immediately on the IntelliSense
auto-suggest drop-down list, but not for the Range Explorer view. To reflect changes to ranges in the
Range Explorer view, you must restart VS Code.

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
