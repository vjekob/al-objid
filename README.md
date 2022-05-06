[![AL Object ID Ninja is licensed under MIT License](https://img.shields.io/github/license/vjekob/al-objid)](https://github.com/vjekob/al-objid/blob/master/LICENSE.md)
[![This extension is written in TypeScript](https://img.shields.io/github/languages/top/vjekob/al-objid)](https://www.typescriptlang.org/)
[![Number of installs](https://img.shields.io/visual-studio-marketplace/i/vjeko.vjeko-al-objid)](https://marketplace.visualstudio.com/items?itemName=vjeko.vjeko-al-objid)
[![Share the love! If you like AL Object ID Ninja, give it 5 stars.](https://img.shields.io/visual-studio-marketplace/stars/vjeko.vjeko-al-objid)](https://marketplace.visualstudio.com/items?itemName=vjeko.vjeko-al-objid&ssr=false#review-details)
[![Last Visual Studio Code Marketplace update](https://img.shields.io/visual-studio-marketplace/last-updated/vjeko.vjeko-al-objid)](https://marketplace.visualstudio.com/items?itemName=vjeko.vjeko-al-objid&ssr=false#version-history)

# AL Object ID Ninja

Zero-configuration, dead-simple, no-collision object ID assignment for multi-user repositories.

## About this repository

This is a monorepo containing the following repos:

- VS Code Extension at [vscode-extension](./vscode-extension)
- Azure Function App at [azure-function-app](./azure-function-app)
- Azure Polling App at [azure-polling-app](./azure-polling-app)
- Documentation at [doc](./doc)

## Why is this repo structured like this?

It's simple. AL Object ID Ninja is not just a VS Code extension. It also contains Azure Function App
serverless back end. These two work together and VS Code extension will not work without the back end,
and back end without the VS Code extension does not make much sense.

In addition to these core components, there is a polling app that is in charge of mimicking a push
notification service until a proper solution (that doesn't cost a fortune) replaces it. The reason why
polling app is separate from the functional back-end (from version 2.0.0 up) is that this allows for
notifications that are more just-in-time while keeping infrastructure costs substantially lower than
they were previously.

## Contributing to this repository

Your contributions are welcome. If you want to contribute a feature, bug fix, improvement, or something
else, just create a pull request. The full process is described [here](https://docs.github.com/en/github/collaborating-with-pull-requests),
but it's far less scary than it looks at first.

Some advice before you start creating pull request:

- Check the [issues section](https://github.com/vjekob/al-objid/issues) to see what are the existing issues and
  where help is wanted.
- Create an issue before starting work! This is important. I may already be working on an improvement
  similar (or equal) to what you planned on working. Also, you may want to solicit feedback from other
  users about how to best implement the feature or improvement you had in mind.
- Do not add functionality to Azure Function App. I am not accepting changes to the back end unless they
  are some critical bug fixes.
- We use [Prettier](https://prettier.io/) around here to format the code. Please make sure you have all the right tooling installed
  so you can contribute code that's easy to read.

That's it. Welcome to this repository, and I am looking forward to your contributions!

## License

This entire repository is licensed under MIT License. Check the details [here](LICENSE.md).
