# License Validation (Preview)

License validation allows you to validate your app against a BC license file (typically a customer
license). The validation will check all your object IDs and check whether those object IDs are
available in the license file. Any object IDs that are not assigned in the license file will be
reported in the `Problems` window and indicated in the source code.

![License problem](https://github.com/vjekob/al-objid/blob/master/doc/images/license-problem.png?raw=true)

## Configuring license validation

To use license validation, you must first configure the license file. You do that by configuring the
`bcLicense` property in the `.objidconfig` configuration file.

For example:

```JSON
{
  "bcLicense": "./1234567-DemoCustomer.bclicense"
}
```

> The path you specify is relative to the folder in which `.objidconfig` (or `app.json`) resides.

At this time, Ninja supports only the [bclicense](https://docs.microsoft.com/en-us/dynamics365-release-plan/2021wave2/smb/dynamics365-business-central/new-license-file-format-support-larger-licenses)
format.

## Running license validation

In this version, license validation **does not** run constantly in the background. When you want to
perform the license validation, you run the `Ninja: Validate object IDs against license (Preview)`
command.

## Why is this feature marked as _"Preview"_?

While this feature technically gets the job done, there are a few things that could/should be
improved:

-   Support for `*.txt` (permission report) format. This is fairly straightforward.
-   Support for `*.flf` format. I am not entirely sure we need this. Plus, it requires hacking, and
    I don't have time for it at the moment. If you already have some reliable info about the FLF file
    format (my assumption is that it's not encrypted, but that it simply uses a signature to protect
    the contents, but that it can actually be read without risking an army of lawyers C&D-ing the bejesus
    out of me).
-   Constant object ID monitoring (background processing). This would be amazing, and it's definitely
    coming, it's only that I need to find a way how to make it run smoothly without slowing everything
    down.
-   Graphical representation of license vs. consumption. This is actually a part of a bigger feature
    I have in mind, where the ID ranges (including license) would be presented in a graphical, interactive
    way.

Of course, if you have any suggestions of your own, please submit them through the
[AL Object ID Ninja issues](https://github.com/vjekob/al-objid/issues) page.
