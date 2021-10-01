# Change Log

All notable changes to the AL Object ID Ninja extension will be documented in this file.

The log is kept in [Keep a Changelog](http://keepachangelog.com/) format. This project follows [Semantic Versioning](https://semver.org/).

## Unreleased
### Added
- App pools feature (https://github.com/vjekob/al-objid/issues/1) supported in the back end.
- Custom back-end URL and app key moved from Visual Studio Code settings to `.objidconfig` file.

## [1.2.7] - 2021-10-01
### Added
- News and announcements feature. This allows the author to "push" notifications to all users to notify them of new features,
webcasts, upcoming changes, service schedules, etc.
- Handling of back-end HTTP response 410 Gone. This response is sent by the back end when there is a breaking change in the back
end. Also, this allows notifications about mandatory updates to be shown to users.
- AL Object ID Ninja is now ready for the upcoming back-end breaking upgrade to "v2" as [announced here](https://vjeko.com/2021/10/01/important-announcement-for-al-object-id-ninja/).
- Whenever you update AL Object ID Ninja to an important new version, release notes are automatically shown.

## [1.2.6] - 2021-09-30
### Changed
- Minor updates to manifest (license).

## [1.2.5] - 2021-09-30
### Changed
- Minor updates to manifest (keywords, badges, links).

## [1.2.4] - 2021-09-30
### Changed
- Fixed documentation URLs after repository restructuring.
- Added categories and tags to the extension manifest.

## [1.2.3] - 2021-09-20
### Changed
- AL Object ID Ninja is now compatible with Visual Studio Code 1.50.1 (September 2020) and newer.

## [1.2.2] - 2021-09-20
### Added
- Auto-synchronization feature is implemented. To read more about this feature, follow [this link](https://github.com/vjekob/al-objid/tree/master/doc/AutoSync.md).

## [1.2.1] - 2021-09-16
### Changed
- The *Azure back end has no information about consumed object IDs. Do you want to synchronize?* question is now asked only once per VS Code
session. Clicking `No` will store that answer for the duration of the session, and will no longer ask that question for the same app. If `No`
is clicked again in the same session for another app, an additional question is asked to either keep or stop prompting. Previously, this
question was asked on every attempt to assign a new number in a repo that hasn't been synchronized.

## [1.2.0] - 2021-09-15
### Added
- Configuration option `Use Verbose Output Logging`. When it is switched on, more logging happens (e.g. deeper back-end invocation logging).
### Changed
- `useBestPracticesParser` settings is now `false` by default. It's (tiny bit) slower than full-syntax parser, but it doesn't confuse users with
why only one object per file was detected. With `false` setting on, whoever uses bad practice of having multiple objects per file will by default
be able to parse full content of their repository without making a configuration change. Those who know that they follow best practices should
switch this setting to `true` to improve the speed (still, speed improvements will only be noticeable on slow machines).
- Polling interval for `getLog` call increased from 15 seconds to 30 seconds to reduce the number of calls placed by the app towards the back end.
- `v2/getLog` endpoint is invoked instead of `v1/getLog` to further reduce the number of calls. The `v2` endpoint accepts multiple repos do
instead of looping through repos every 15 seconds and then sending individual requests for each of them, there is now one single request.

## [1.1.0] - 2021-09-13
### Added
- Merge synchronization feature. It allows merging actual object ID consumption (as collected from the repo) with recorded consumption in the back end.
([Git Issue #4](https://github.com/vjekob/al-objid/issues/4))
- `getConsumption` endpoint in the back end. It returns actual ID consumption per object type. This will be useful for several upcoming features.
### Changed
- Synchronization box has different UI when asking for type of synchronization to perform.
### Fixed
- Fixed possible closure bug with notifications processing when multiple folders are added in the workspace.

## [1.0.5] - 2021-09-13
### Fixed
- Fixed bug with `getLog` service returning empty string instead of empty JSON array when no log files are found ([Git Issue #6](https://github.com/vjekob/al-objid/issues/6))
- Fixed bug with `Learn more` button not working in the initial sync toast notification.
- Fixed bug with `idRange` property not being read from `app.json` manifest ([Git Issue #7](https://github.com/vjekob/al-objid/issues/7))

## [1.0.4] - 2021-09-12
### Added
- `Learn more` button added to the first synchronization toast message.
- Best-practices parser option added, and turned on by default. When this option is off, only one object per file will be parsed. This option will improve
synchronization speed on very large repositories when used from very slow computers.

### Changed
- `.objidauth` file renamed to `.objidconfig` to encompass more functionality this file now covers.

## [1.0.3] - 2021-09-10
### Fixed
- Fixed the bug with SHA256 not actually being created from app id. This was embarrassing, really. One more reason to invest some time into testability ASAP.

## [1.0.2] - 2021-09-10
### Changed
- App id read from the `app.json` manifest is no longer used to identify the extension anywhere in the front or back end. Instead
### Fixed
- Changelog modified to include the project history so far.

## [1.0.1] - 2021-09-10
### Fixed
- Images referred from README.md are read from the internet, instead of from relative repo path. This may be wrong, but this fixed broken images in the extension landing page in the Marketplace (and Extensions list in VS Code).

## [1.0.0] - 2021-09-10
### Added
- Initial version of the extension.