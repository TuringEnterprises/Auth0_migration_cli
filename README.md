# TURING-AUTH0-CLI

A CLI tool for migrating users of Turing products to Auth0 

## Installation

Clone the repository

Install the dependencies:

```
npm i
```

Install the package globally on your machine:

```
npm i -g
```

Copy the .sample-env file into a new .env file and fill in the values.


## Usage

To get the usage help, just run:

```
turing-auth0
```

1. To get the total count of users to be imported:

```
turing-auth0 count
```

2. To list all accounts for import:

```
turing-auth0 list
```

3. To create a new user in Auth0 system:

```
turing-auth0 create
```

For example:

```
turing-auth0 create -e test@mail.com -p testpass -n John Doe
```

4. And funally, to import Postmatch internal users to Auth0:

```
turing-auth0 import
```

It should print the import summary at the end of job.