# Auth0_migration_cli

A node cli to batch upload internal turing users to auth0

### Installation

```sh
npm install
```

## Credential Access

Create **migrate_profile** file in the root directory of your VM with the following keys
like so

-   touch ~/.migrate_profile

-   vim ~/.migrate_profile

Then add the following keys

```
ACCOUNT_NAME=

AUTH0_CLIENT_ID=

AUTH0_CLIENT_SECRET=

AUTH0_MANAGEMENT_CLIENTID=

AUTH0_MANAGEMENT_CLIENT_SECRET=

AUTH0_AUDIENCE=

DB_CONNECTION_ID=

AUTH0_TENANT=
```

### Usage

```sh
migrate
```
