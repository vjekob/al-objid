# Deploying a Self-Maintained Back End

**Last change**: December 14, 2025

AL Object ID Ninja uses a public API to manage object IDs. While this API is deployed on Microsoft Azure
infrastructure and uses secure HTTPS communication, you may prefer using your own Azure subscription and
your own resources.

This document explains how to deploy your own Azure Functions back end for AL Object ID Ninja.

> **Version note (v3)**: These instructions are for the **v3 back-end endpoints**. If you previously
> deployed a private back end for **v2**, keep it running and deploy this **v3 back end in parallel**—the
> AL Object ID Ninja **v3 VS Code extension is not compatible with v2 endpoints**.

## Infrastructure Description

The back end is a **single Azure Functions app** (Node.js) that stores its data in **Azure Blob Storage**.

- **Function app code**: `backend/` in this repository
- **Storage**: one Azure Storage account (Blob)

## Repository

All of AL Object ID Ninja is maintained in one monorepo:

- https://github.com/vjekob/al-objid

The Azure Functions back end is located here:

- `backend/`

## Deploying the Azure Functions app

You can deploy the Azure Functions app any way you prefer (VS Code deployment, GitHub Actions, Azure
DevOps, etc.).

> Note: This document does not provide a step-by-step guide for deploying Azure Functions. If you are not
> familiar with Azure Functions deployment, see the official documentation:
> https://docs.microsoft.com/en-us/azure/azure-functions/

There are no requirements about naming the function app. You can choose any name you want.

### Runtime Stack

When creating the Function App (or configuring your deployment template), use:

- Runtime Stack: Node.js
- Version: 20 LTS (Azure Functions v4)

### Operating System

Your choice of operating system is entirely up to you. The app can run on Windows or Linux.

### Environment Variables

The back-end requires the following environment variables to be configured.

| Variable                   | Value  | Usage notes                   |
| -------------------------- | ------ | ----------------------------- |
| `PRIVATE_BACKEND`          | `true` | Case-insensitive feature flag |
| `USE_FUNCTION_ACCESS_KEYS` | `true` | Case-insensitive feature flag |

#### `PRIVATE_BACKEND` Flag

When running the back-end on your own infrastructure, you must set this flag to skip commercial platform checks that are not needed in a private deployment.

**What it does**: When set to `true`, the back-end will skip checks such as:
- App assignment validation (whether apps are assigned to your account)
- User authorization checks (whether users are allowed to assign numbers)
- Consumption counting
- Orphan app management

#### `USE_FUNCTION_ACCESS_KEYS` Flag

This flag controls whether the back-end requires Azure Function access keys for authorization.

**Default behavior (flag not set or `false`)**: All HTTP requests to function endpoints are accepted without authentication. Anyone who knows your Function App URL can access the back-end.

**When set to `true`**: The back-end enforces authorization using Azure Function access keys:
- **Obtaining the key**: In the Azure portal, navigate to your Function App → Functions → App keys. Copy the default host key or create a new one. 
- **Configuring VS Code AL Ninja Extension**: Set the `objectIdNinja.backEndAPIKey` setting to the function access key you copied.
- **Security**: All requests without a valid function access key will be rejected with HTTP 401 Unauthorized.


## Storage

This back end requires **one Azure Storage account** for Blob storage.

There are three containers you must create:

| Container | Purpose                                                                  |
| --------- | ------------------------------------------------------------------------ |
| `apps`    | Stores app and pool consumption information                              |
| `logs`    | Stores logs and details for the Range Explorer feature and notifications |
| `system`  | System-level blobs, caches, and similar                                  |

> The `system` container should actually not be needed by self-hosted instances. This container keeps track of information relevant for the public commercial back-end infrastructure to work correctly. However, to avoid accidental bugs due to container not being present, it's best to just create this container. Better safe than sorry, they say.

## Configuring the Azure Functions app

After the function app is deployed, configure its **Application settings** (Function App → Settings →
Configuration → Application settings).

AL Object ID Ninja requires a single back-end setting:

| Setting                           | Description                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `AZURE_STORAGE_CONNECTION_STRING` | Connection string for the Azure Storage account used by AL Object ID Ninja. |

## Configuring AL Object ID Ninja

Once your back end is deployed, configure AL Object ID Ninja to use your own back end:

| Setting                       | Description                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `objectIdNinja.backEndUrl`    | Host name of the Function App you deployed.                                                          |
| `objectIdNinja.backEndAPIKey` | App key used by your Function App. If your app does not use app keys, do not configure this setting. |

When configuring the host name, do not use the full URL. For example, if your function app endpoint is
`https://example.azurewebsites.net/`, set `example.azurewebsites.net` as the `objectIdNinja.backEndUrl`
configuration value.

# Change Log

### December 14, 2025

Added `PRIVATE_BACKEND` configuration flag section.
Added description of containers necessary for correct operation.
