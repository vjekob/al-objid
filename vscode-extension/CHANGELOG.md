# Change Log

All notable changes to the AL Object ID Ninja extension will be documented in this file.

The log is kept in [Keep a Changelog](http://keepachangelog.com/) format. This project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

Work is in progress on two upcoming features, both of which heavily depend on tree view refactoring done in 2.9.0:

-   License Explorer: allows you to have better insight into licensed state of your objects. It allows to have
    multiple active licenses and to see license report for all of them independently.
-   Managed app pools: allows you to create app pools with full control of apps included in them. Existing unmanaged
    pools allow anyone who knows the pool ID to join their app into a pool. Managed pools allow you to control who
    can join the pool, you can remove apps from pool centrally, and you can make sure that only apps that are actually
    a part of the pool to assign object IDs to that pool.

## [2.12.0] - 2023-09-10

### Added

-   Interactive assignment feature. This allows you to assign a new object ID from within a custom range you define
    on the fly. Some companies prefer having their object IDs to be arranged in a specific way, and this feature
    allows you to do that. When assigning a new object ID, simply specify the minimum and the maximum object ID you
    want to assign from, and Ninja will assign the next available object ID from that range (or it will let you know
    if it can't find any available object IDs in that range).

## [2.11.3] - 2023-08-24

### Fixed

-   New namespace declarations (`namespace` and `using`) prevented parsing of entire objects.

## [2.11.2] - 2023-08-24

### Fixed

-   Parsing precompiler directives failed under certain circumstances (end of line character sequence), which in turn
    causes some objects to be incompletely parsed. This prevented synchronization of any object IDs in some repos.

## [2.11.1] - 2023-04-22

### Fixed

-   Removed confusing contextual commands from Command Palette ([Git issue #60](https://github.com/vjekob/al-objid/issues/60)

## [2.11.0] - 2023-04-14

### Added

-   Consumption Report: gives you a summary of object consumption per object type, which is very useful for license
    management. You can choose whether to save the report in a file or to copy it to clipboard. Supports text, JSON,
    CSV, and XML formats. ([Git issue #33](https://gitub.com/vjekob/al-objid/issues/33))
-   Assignment Explorer: provides an overview of manually assigned objects (that are likely going to cause conflicts
    when merging) and "lost" object (assigned with Ninja, but then deleted, making their object ID unused, but unavailable
    for assignment). The view is interactive and allows fixing both kinds of issues directly from the view.
-   Manually assigned objects are clearly marked as such in code and in _Problems_ panel. Quick fix is availale to store
    the assignment in the back end.

## [2.10.0] - 2023-03-31

### Added

-   Ninja exports API so other VS Code extensions can reserve object IDs. ([Git issue #8](https://github.com/vjekob/al-objid/issues/8))
    (Thanks for contribution, Andrzej Zwierzchowski)
-   When publisher is "Microsoft", no user-identifiable information is ever sent to the back-end for the purpose of
    notifying the other team members which user has consumed which object ID.
-   Protected publishers feature added. This allows publishers who don't want to use the notifications feature about
    consumed object IDs to be explicitly prevented by Ninja to share such info.

### Fixed

-   Config file cannot specify relative license path that specifies levels up from current workspace folder.
    ([Git issue #52](https://github.com/vjekob/al-objid/issues/52)).
-   Obsolete objects are shown as not included in license. ([Git issue #47](https://github.com/vjekob/al-objid/issues/47))
-   Temporary tables are shown as not included in license. ([Git issue #40](https://github.com/vjekob/al-objid/issues/40))
-   Issue with occasional message about scheduled maintenance, saying that the service will be "ready agan in NaN minute(s)".

## [2.9.2] - 2023-03-26

### Added

-   Telemetry events included in several places where they were not previously sent.

### Fixed

-   Selecting folder from among workspace folders causes the _Cannot read properties of undefined (reading
    'manifest')_ error. ([Git issue #39](https://github.com/vjekob/al-objid/issues/39))
-   Issues when sending telemetry caused many events to be missed under certain circumstances. Race conditions in
    executing asynchronous initialization logic prevented this issue to be identified.
-   Selecting "Learn more" in some situations does not show a document, and shows the "<document> not found"
    message.
-   Initial synchronization of object IDs uses some more user-friendly and straightforward language to explain
    what's going on.

## [2.9.1] - 2022-06-08

### Fixed

-   Extension activation context re-introduced. Ninja now does not contribute views or commands until it becomes active.
    This takes care of confusing situation when Ninja icon appears in activity bar or Ninja commands appear in command
    palette, without any AL workspace being loaded or active.

## [2.9.0] - 2022-06-08

### Added

-   "Go to definition" command added to all relevant nodes in Range explorer. This allows jumping to a range definition
    in `app.json` or `.objidconfig` directly from range explorer.

### Changed

-   Range explorer as been through massive refactoring (again). The previous refactoring involved a lot of fumbling
    around how logical and actual representations of tree items (nodes) worked. The previous solution was fully
    functional, but extremely difficult and complicated to maintain, and was requiring far too much code duplication
    to support any other tree views. The refactoring in this verion uses an approach that requires no duplication and
    allows supporting new tree views through simply providing new node types.
-   Range explorer uses new icon types and a simplified structure. Icons indicate four states (no consumption, most
    IDs available, most IDs consumed, running out, fully consumed) but they only indicate these states through color,
    not through icon shape. Also, there are no more "No consumption" nodes, this information is now communicated
    through color and node state (keeps the view much more concise and easier to read).
-   Changed icons for "Synchronize" and "Automatically synchronize" commands in Range explorer. New icons derive from
    Codicons icon collection (a part of VS Code), that also comes with simpler license than previous icons did, and
    follows the VS Code existing design language more closely.

### Fixed

-   Tree view does not reset its expand/collapse state after changes in workspace or consumption state. Previously,
    if, for example, consumption changes while the tree view is collapsed, it would automatically expand all when
    refreshing. Now, tree state is retained when updating tree.
-   Diagnostics don't update after all content removed. ([Git issue #35](https://github.com/vjekob/al-objid/issues/35))

## [2.8.1] - 2022-05-28

### Fixed

-   Fixes issues with `package.json` and `CHANGELOG.md` (version 2.8.0 published accidentally instead of 2.7.1).

## [2.8.0] - 2022-05-28

### Fixed

-   Ninja can now read `app.json` files saved in [`UTF-8 with BOM` file format](https://en.wikipedia.org/wiki/Byte_order_mark#UTF-8).
    ([Git issue #36](https://github.com/vjekob/al-objid/issues/36))

## [2.7.0] - 2022-05-19

### Added

-   Range explorer includes logical ranges and object ranges from `.objidconfig` file.
-   License actions are added to Explorer context menu. When right-clicking a `*.bclicense` file, there
    are two more license options there: validate against license, and select default license.
-   Range explorer contains expand all and collapse all icons. ([Git issue #18](https://github.com/vjekob/al-objid/issues/18))
-   Linting of `.objidconfig` files happens not only on save, but also on editing.

### Changed

-   Range explorer does not propagate color and badges upwards in the hierarchy. For example, if there are
    3 remaining codeunits in a range, then only the codeunits node is highlighted and shows the badge, but
    the parent or any ancestors retain their existing style. This makes the actual nodes where attention
    is actually needed stand out a lot better. With many more nodes in the new range explorer, propagated
    highlighting and badges resulted in it being less obvious where exactly the problem is.
-   Code base is massively refactored around how AL workspaces, and `app.json` and `.objidconfig` files are
    handled. This refactoring not only makes code far cleaner and easier to maintain and extend, but also
    improves performance and stability.
-   Completely new `.objidconfig` linter is included. It performs better, and depends on new AL workspace
    infrastructure. Also, linting diagnostic messages are more consistent and straightforward.

### Removed

-   Several warning messages about `.objidconfig` misconfiguration are excluded. They are now covered by
    linter.
-   Several quick-fix actions for `.objidconfig` are removed. They may be added in a later version.

### Fixed

-   License validation is fixed for `tableextension` and `pageextension` object. Seems that these kinds of
    objects do not require any license validation. ([Git issue #32](https://github.com/vjekob/al-objid/issues/32))

## [2.6.1] - 2022-05-06

### Fixed

-   Activation issues sorted out. `package.json` didn't properly control when Ninja's contributed commands
    should be shown in the Command Palette, and when not.

### Removed

-   Activation on "Show Release Notes" command was removed. The command is now activated when everything
    else is activated, so that somebody doesn't inadvertently activate entire Ninja extension outside of an
    AL workspace.

## [2.6.0] - 2022-05-06

### Added

-   Logical ranges per object type feature is introduced. It allows defining different logical ranges per
    AL object type. For example, "Sales" range may be 50100..50500 in general, but for codeunits it may be
    50100..50999. Logical ranges per type don't integrate (yet) with the Range Explorer view.
-   Code actions to help fixing issues with some `.objidconfig` issues.

## [2.5.0] - 2022-05-04

### Added

-   Configuration option `objectIdNinja.includeUserName` is re-introduced. Even though sensitive information
    is encrypted, the encryption is both symmetric and easy to decrypt for anyone with access to app ID. Some
    companies prefer not storing any sensitive information in the back end due to privacy policies and because
    their app IDs are publicly known.
-   Logical ranges and range descriptions can be defined in `.objidconfig` configuration file. This allows
    more flexibility during assigning new IDs. Logical ranges are automatically represented in Range Explorer
    and IntelliSense auto-suggestion drop-down list.
-   App pools feature is introduced. It allows multiple apps to share the same consumption information, thus
    making it possible to share same number ranges between different apps
    ([Git issue #1](https://github.com/vjekob/al-objid/issues/1)) or even between different vendors
    ([Git issue #19](https://github.com/vjekob/al-objid/issues/19)).
-   License validation feature is introduced. It allows you to check your object IDs against a (customer)
    license and see if there are any object IDs your app uses, that aren't assigned to the license with which
    the app will run ([Git issue #5](https://github.com/vjekob/al-objid/issues/5)).
-   `.objidconfig` file validation and integration with Problems window. Any configuration you make manually
    to the `.objidconfig` is now validated automatically, and any problems are both reported to you in the
    Problems window, and indicated in the editor.

### Changed

-   Ninja activation events are reduced to AL Language and Show Release Notes commands. This makes sure
    that unnecessary Ninja commands are not available in the Command Palette if there are no AL folders
    open.
-   Authorization and deauthorization workflows are improved and can now handle multiple roots (apps) in
    a multi-root workspaces to authorize/de-authorize multiple apps in one go.

### Removed

-   Reauthorization feature is removed, due to refactoring in Git-scoped operations. Reauthorizing an app
    can still be done manually by deauthorizing the app, and then authorizing it again. Attempting to
    authorize an app that's already authorized will now result in an error.

## [2.4.1] - 2022-04-30

### Fixed

-   Object ID suggestions are sorthed alphabetically, instead of following range order from the `app.json`
    app manifest file (https://github.com/vjekob/al-objid/issues/29)

## [2.4.0] - 2022-04-28

### Added

-   Requesting and assigning IDs from multiple ranges (https://github.com/vjekob/al-objid/issues/11)

## [2.3.1] - 2022-02-22

### Fixed

-   Parser passes through all directives correctly so all objects are returned from all possible paths through
    all #if..#elif..#else..#endif directives. [Git issue #12](https://github.com/vjekob/al-objid/issues/12)
-   Consumption warnings are correctly calculating consumptions when there are registered object IDs that fall
    outside ranges defined in the `app.json` file. [Git issue #27](https://github.com/vjekob/al-objid/issues/27)

## [2.3.0] - 2022-02-19

### Added

-   Name and e-mail address of the person who authorized an app is shown in the status bar.
-   Ninja does not communicate with the back end for apps that are not using it for object ID assignment.
-   Ninja monitors the `.objidconfig` file to make sure it is not accidentally deleted.

### Changed

-   Authorization process is more robust: it requires Git repository to be clean, and it auto-commits
    the `.objidconfig` authorization key file.
-   Output logging distinguishes between verbose (very detailed) and normal log levels.

### Fixed

-   Ninja suggests enum IDs when enum is already named [Git issue #23](https://github.com/vjekob/al-objid/issues/23)

## [2.2.0] - 2021-12-12

### Added

-   Field IDs (for `table` and `tableextension` objects) and value IDs (for `enum` and `enumextension` objects)
    are now assigned from the back-end.

### Changed

-   Old built-in parser is replaced with @vjeko.com/al-parser-ninja. This, in turn, is based on a separate
    project @vjeko.com/al-parser (not yet public as of time of this change log update). The new parser is
    much faster than the previous one, and it provides information about all field IDs (for tables and table
    extensions) and value IDs (for enums and enum extensions).

### Removed

-   The `useBestPracticesParser` setting and all related business logic is removed. Its purpose was primarily
    to allow using a faster parser. The new parser is 2.5x faster than the previous "best-practices" parser,
    6x fastere than the previous slow parser, and it parses full content (rather than just the first object).

## [2.1.3] - 2021-10-19

### Changed

-   Polling back end is not invoked if it's misconfigured (custom main back end, but default polling back-end).
-   Ninja icon shows in activity bar only when the extension is active.

## [2.1.2] - 2021-10-18

### Added

-   Telemetry feature introduced. This is not a user-level feature.

### Fixed

-   Bug with invoking custom polling back-end ([Git Issue #17](https://github.com/vjekob/al-objid/issues/17))

## [2.1.1] - 2021-10-17

### Added

-   Release nots for 2.1.0

## [2.1.0] - 2021-10-17

### Added

-   Range Explorer feature that shows an overview of range consumption per app.
-   Warning toast notifications are shown when a range is about to run out of available IDs.
-   Error at startup when incorrect self-hosted configuration is detected.

## [2.0.1] - 2021-10-14

### Added

-   Command `Ninja: Show Release Notes` is included. It shows release notes for the actual version, if they
    are available.

### Changed

-   Notifications polling through the `v2/getLog` endpoint is replaced with `v2/check`. Also, notifications
    polling is invoking a different back-end endpoint.
-   News polling through `v2/news` is discontinued. Instead, news information is included in the `v2/check`
    endpoint calls. This also means that news polling is happening at the same intervals as notifications polling.
-   Polling is not happening at fixed 30-seconds interval, but includes an automatic back-off algorithm that
    increases the polling interval slightly if there are no notifications or news, until it reaches maximum
    polling interval which is set at 15 minutes.
-   User name is encrypted before sending it with any back-end calls. Encryption is using a key extrapolated
    from the app ID, so it's not possible for anyone outside the development team to decrypt the username. This
    means that absolutely no user-identifiable (as per GDPR) is stored anywhere.
    ([Git Issue #2](https://github.com/vjekob/al-objid/issues/2))
-   Commands are renamed from `Vjeko: <Command Text>` to `Ninja: <Command Text>`.
    ([Git Issue #13](https://github.com/vjekob/al-objid/issues/13))

### Removed

-   Configuration option `objectIdNinja.includeUserName` is removed. Since user name is now encrypted using a
    symmetric encryption where key is now known to third parties, there are no privacy concerns.

## [2.0.0] - 2021-10-09

### Changed

-   AL Object ID Ninja invokes "v2" version of the back end. This allows it to read and write data from/to
    the new, more efficient app cache storage. Read more at
    https://vjeko.com/2021/10/04/al-object-id-ninja-scheduled-maintenance-announcement-october-9-at-1900-cet/
-   Invocation of `v2/getLog` has been temporarily suspended. It will be reintroduced in v2.0.1 after the new,
    more efficient `v2/getLog` is fully built.

## [1.2.8] - 2021-10-04

### Added

-   Handling of back-end HTTP response 503 Service Unavailable. This response is sent by the back end when there is an undergoing
    scheduled maintenance. When receiving this status, Ninja will indicate when (in how many minutes) the service will be back again.

## [1.2.7] - 2021-10-01

### Added

-   News and announcements feature. This allows the author to "push" notifications to all users to notify them of new features,
    webcasts, upcoming changes, service schedules, etc.
-   Handling of back-end HTTP response 410 Gone. This response is sent by the back end when there is a breaking change in the back
    end. Also, this allows notifications about mandatory updates to be shown to users.
-   AL Object ID Ninja is now ready for the upcoming back-end breaking upgrade to "v2" as [announced here](https://vjeko.com/2021/10/01/important-announcement-for-al-object-id-ninja/).
-   Whenever you update AL Object ID Ninja to an important new version, release notes are automatically shown.

## [1.2.6] - 2021-09-30

### Changed

-   Minor updates to manifest (license).

## [1.2.5] - 2021-09-30

### Changed

-   Minor updates to manifest (keywords, badges, links).

## [1.2.4] - 2021-09-30

### Changed

-   Fixed documentation URLs after repository restructuring.
-   Added categories and tags to the extension manifest.

## [1.2.3] - 2021-09-20

### Changed

-   AL Object ID Ninja is now compatible with Visual Studio Code 1.50.1 (September 2020) and newer.

## [1.2.2] - 2021-09-20

### Added

-   Auto-synchronization feature is implemented. To read more about this feature, follow [this link](https://github.com/vjekob/al-objid/tree/master/doc/AutoSync.md).

## [1.2.1] - 2021-09-16

### Changed

-   The _Azure back end has no information about consumed object IDs. Do you want to synchronize?_ question is now asked only once per VS Code
    session. Clicking `No` will store that answer for the duration of the session, and will no longer ask that question for the same app. If `No`
    is clicked again in the same session for another app, an additional question is asked to either keep or stop prompting. Previously, this
    question was asked on every attempt to assign a new number in a repo that hasn't been synchronized.

## [1.2.0] - 2021-09-15

### Added

-   Configuration option `Use Verbose Output Logging`. When it is switched on, more logging happens (e.g. deeper back-end invocation logging).

### Changed

-   `useBestPracticesParser` settings is now `false` by default. It's (tiny bit) slower than full-syntax parser, but it doesn't confuse users with
    why only one object per file was detected. With `false` setting on, whoever uses bad practice of having multiple objects per file will by default
    be able to parse full content of their repository without making a configuration change. Those who know that they follow best practices should
    switch this setting to `true` to improve the speed (still, speed improvements will only be noticeable on slow machines).
-   Polling interval for `getLog` call increased from 15 seconds to 30 seconds to reduce the number of calls placed by the app towards the back end.
-   `v2/getLog` endpoint is invoked instead of `v1/getLog` to further reduce the number of calls. The `v2` endpoint accepts multiple repos do
    instead of looping through repos every 15 seconds and then sending individual requests for each of them, there is now one single request.

## [1.1.0] - 2021-09-13

### Added

-   Merge synchronization feature. It allows merging actual object ID consumption (as collected from the repo) with recorded consumption in the back end.
    ([Git Issue #4](https://github.com/vjekob/al-objid/issues/4))
-   `getConsumption` endpoint in the back end. It returns actual ID consumption per object type. This will be useful for several upcoming features.

### Changed

-   Synchronization box has different UI when asking for type of synchronization to perform.

### Fixed

-   Fixed possible closure bug with notifications processing when multiple folders are added in the workspace.

## [1.0.5] - 2021-09-13

### Fixed

-   Fixed bug with `getLog` service returning empty string instead of empty JSON array when no log files are found ([Git Issue #6](https://github.com/vjekob/al-objid/issues/6))
-   Fixed bug with `Learn more` button not working in the initial sync toast notification.
-   Fixed bug with `idRange` property not being read from `app.json` manifest ([Git Issue #7](https://github.com/vjekob/al-objid/issues/7))

## [1.0.4] - 2021-09-12

### Added

-   `Learn more` button added to the first synchronization toast message.
-   Best-practices parser option added, and turned on by default. When this option is off, only one object per file will be parsed. This option will improve
    synchronization speed on very large repositories when used from very slow computers.

### Changed

-   `.objidauth` file renamed to `.objidconfig` to encompass more functionality this file now covers.

## [1.0.3] - 2021-09-10

### Fixed

-   Fixed the bug with SHA256 not actually being created from app id. This was embarrassing, really. One more reason to invest some time into testability ASAP.

## [1.0.2] - 2021-09-10

### Changed

-   App id read from the `app.json` manifest is no longer used to identify the extension anywhere in the front or back end. Instead

### Fixed

-   Changelog modified to include the project history so far.

## [1.0.1] - 2021-09-10

### Fixed

-   Images referred from README.md are read from the internet, instead of from relative repo path. This may be wrong, but this fixed broken images in the extension landing page in the Marketplace (and Extensions list in VS Code).

## [1.0.0] - 2021-09-10

### Added

-   Initial version of the extension.
