# Auth0_migration_cli

A node cli to batch upload internal turing users to auth0

### Installation

```sh
npm install
```

Then add the following keys

### Usage

```sh
migrate
```

## Credential Access

Provide an absolute path to the json file containing the following AUTH0 credentials

1. DB_CONNECTION_ID

[How to get DB_CONNECTION_ID](https://auth0.com/docs/authenticate/identity-providers/locate-the-connection-id)

AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET

```
To get the above keys Click the application tab in your tenant -> Select an aplication(Machine to Machine) -> Copy credentials
```

2. AUTH0_MANAGEMENT_CLIENTID

3. AUTH0_MANAGEMENT_CLIENT_SECRET

4. AUTH0_AUDIENCE

```
To get the three keys above:
1. Select APIs tab in your tenant
2. Select Auth0 Management API
3. Click on the test tab
4. Copy credentials
```

5. AUTH0_TENANT

```
To get the Auth0 tenant
1. Click on any application in the application tab
2. Select Domain
```

6. ACCOUNT_NAME

```
Click on the top left bar to get Account_Name
```
