# Change Log

All notable changes to the AL Object ID Ninja extension will be documented in this file.

The log is kept in [Keep a Changelog](http://keepachangelog.com/) format. This project follows [Semantic Versioning](https://semver.org/).

## Unreleased
### Added
- App pools feature (https://github.com/vjekob/al-objid/issues/1).
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