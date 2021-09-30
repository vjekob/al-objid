# AL Object ID Ninja

Zero-configuration, dead-simple, no-collision object ID assignment for multi-user repositories.

## About this repository

This is a monorepo containing the following repos:
* VS Code Extension at [vscode-extension](./vscode-extension)
* Azure Function App at [azure-function-app](./azure-function-app)
* Documentation at [doc](./doc)

## Why is this repo structured like this?

It's simple. AL Object ID Ninja is not just a VS Code extension. It also contains Azure Function App
serverless back end. These two work together and VS Code extension will not work without the back end,
and back end without the VS Code extension does not make much sense. That's why there are two roots
in this repo: one for the VS Code Extension, and one for Azure Function App.

## Contributing to this repository

Your contributions are welcome. If you want to contribute a feature, bug fix, improvement, or something
else, just create a pull request. The full process is described [here](https://docs.github.com/en/github/collaborating-with-pull-requests),
but it's far less scary than it looks at first.

Some advice before you start creating pull request:
* Check the [issues section](https://github.com/vjekob/al-objid/issues) to see what are the existing issues and
where help is wanted.
* Create an issue before starting work! This is important. I may already be working on an improvement
similar (or equal) to what you planned on working. Also, you may want to solicit feedback from other
users about how to best implement the feature or improvement you had in mind.
* Do not add functionality to Azure Function App. I am not accepting changes to the back end unless they
are some critical bug fixes.

That's it. Welcome to this repository, and I am looking forward to your contributions!

## License

This entire repository is licensed under MIT License. Check the details [here](LICENSE.md).
