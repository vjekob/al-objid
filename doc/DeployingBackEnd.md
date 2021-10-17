# Deploying a Self-Maintained Back End

AL Object ID Ninja uses a public API to manage object IDs. While this API is deployed on Microsoft Azure
infrastructure and uses secure HTTPS communication, you may prefer using your own Azure subscription and
your own resources.

This document explains how to set up your own Azure serverless back-end to use with AL Object ID Ninja.

> Important note: You may have already set up your own infrastructure prior to AL Object ID Ninja v2.0.1.
Such infrastructure is incompatible with AL Object AL Ninja v2.0.1 and newer and you'll have to deploy a
new set of back-end services.

## Infrastructure Description

The back-end infrastructure comprises two independent Azure Functions apps:
* ***Business Logic*** app. This is the main app that AL Object ID Ninja communicates with when performing
its business logic. This includes assigning new object IDs, authorizing your app, synchronizing IDs, and so
on. Prior to v2.0.1, this was the only Azure Functions app that existed.
    > For public AL Object ID Ninja API, this app is running at https://vjekocom-alext-weu.azurewebsites.net
* ***Polling*** app. AL Object ID Ninja sends periodic poll requests to ask the back end about the latest
state of the app(s) you are developing. This was a non-essential feature in versions prior to v2.0.1 and it
only served the purpose of showing notifications about object IDs assigned by other users on your team.
However, with AL Object ID Ninja v2.0.1 this app serves purpose of synching object ID state across your
entire team, and information it exchanges is essential for certain features that are going to be introduced
starting with v2.1.0.
    > For public AL Object ID Ninja API, this app runs at https://vjekocom-alext-weu-poll.azurewebsites.net

If you want to run AL Object ID Ninja with your own Azure subscription, then you must deploy both of these
apps. Deploying just the business logic app will be enough to assign object IDs, but without the polling
app you will not have access to any of useful upcoming features such as range explorer, warnings about
running out of IDs, Problems feature integration, and many more.

## Repositories

All of AL Object ID Ninja is maintained in one monorepo at the following URL: 
https://github.com/vjekob/al-objid

Inside that repository, each of the Azure Functions apps described in the previous section has its own
directory:
* Business Logic app: https://github.com/vjekob/al-objid/tree/master/azure-function-app
* Polling App: https://github.com/vjekob/al-objid/tree/master/azure-polling-app

The best way to start is by cloning the entire monorepo, and then deploy each of the function apps from
its own directory.

## Deploying the apps

You can deploy the Azure Functions apps any way you prefer. You can do that manually from VS Code, or you
can set up your own AL Object ID Ninja fork and configure automated deployment from there. The choice is
entirely up to you.

> Note: This document does not provide a step-by-step guide for deploying Azure Functions apps. If you are
not familiar with this, read the latest deployment documentation at
https://docs.microsoft.com/en-us/azure/azure-functions/

There are no requirements about naming the function app when deploying. You can choose whichever name you
want for each of them.

### Storage Account

All Azure Functions apps require a storage account to run. Azure uses this storage account to host your
Azure Functions apps (store your app's files, manage bindings, scale out when necessary, etc.)

On top of this general-purpose account required by Azure, AL Object ID Ninja uses its own storage:
* Blob container storage is used to keep information about object IDs and ranges used by the app(s) you
develop. You may choose whatever name you want for this storage container.
* Queue is used to by the business logic app to notify the polling app about any changes made to
the Blob storage. You **must** name this queue `appchange`.

> **IMPORTANT** You must manually create a Blob container (with any name of your choice) and a Queue
(named `appchange`) to be used for the purpose described in the bullet points above.

You may deploy everything in one storage account, or you may prefer deploying each component in separate
storage accounts. It's entirely up to you. AL Object ID Ninja will work equally fine with any kind of
back-end storage layout you choose to use.

> The only consideration you have with deploying the storage for AL Object ID Ninja is that at the time
of writing this document, only the **Standard/Hot** storage tier supports all kinds of operations needed
by Azure to host your functions, and that **Premium** storage tier only supports Blob operations. Public
AL Object ID Ninja infrastructure uses a single Standard/Hot storage account to host both Azure Functions
apps and to run the Queue needed by AL Object ID Ninja functionality, and another Premium storage account
to store all Blobs that keep information about apps, object IDs, and ranges.

### Runtime Stack

AL Object ID Ninja Azure Functions both run on Node.js. When creating your Azure Functions or configuring
your deployment templates, make sure to use or configure the following:
* Runtime Stack: Node.js
* Version: 14 LTS

### Operating System

Your choice of operating system is entirely up to you. AL Object ID Ninja's public Azure Functions apps
run on Linux, but they will run equally well under Windows as well.

## Configuring the apps

Once your apps are deployed, they will need certain application configuration settings to operate.

> **IMPORTANT** This section is about Azure Functions Application Configuration settings, not about the
AL Object ID Ninja client settings. You ***must*** complete this configuration, otherwise AL Object ID
Ninja will not work correctly or will not work at all.

### Configuring the business logic app

After oyu have deployed the business logic app for the first time, under **Settings** click
**Configuration**, and then under **Application Settings** create the following configuration settings:

| Setting | Description |
|-|-|
| `DefaultStorage` | Connection string for the storage account that stores the Blob container used by AL Object ID Ninja. |
| `DefaultContainer` | Name of the container that stores Blobs that keep information about object IDs and ranges. |
| `NotifyQueueStorage` | Connection string for the storage account that stores the Queue used by your Azure Functions apps. |

### Configuring the polling app

After oyu have deployed the business logic app for the first time, under **Settings** click
**Configuration**, and then under **Application Settings** create the following configuration settings:

| Setting | Description |
|-|-|
| `DefaultStorage` | Connection string for the storage account that stores the Blob container used by AL Object ID Ninja. |
| `DefaultContainer` | Name of the container that stores Blobs that keep information about object IDs and ranges. |
| `QueueStorage` | Connection string for the storage account that stores the Queue used by your Azure Functions apps. |

## Configuring AL Object ID Ninja

Once your back-end infrastructure is in place and configured, you must configure AL Object ID Ninja to use
your own back end. For this, you'll need the following configuration settings:

| Setting | Description |
|-|-|
| `objectIdNinja.backEndUrl` | URL of the business logic app you deployed. |
| `objectIdNinja.backEndAPIKey` | App key used by your business logic app. If your app does not use app keys, do not configure this setting. |
| `objectIdNinja.backEndUrlPoll` | URL of the polling app you deployed. |
| `objectIdNinja.backEndAPIKeyPoll` | App key used by your polling app. If your app does not use app keys, do not configure this setting. |

> Public function apps used by AL Object ID Ninja do not use any app keys. It would be pointless, because
they are accessed by a public application with publicly available source code. However, you may prefer
securing your function apps with app keys. The choice is entirely up to you. Just keep in mind that out
of the box, AL Object ID Ninja does not support any other kind of authorization, except through app keys.
