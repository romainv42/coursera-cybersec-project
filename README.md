# coursera-cybersec-project

## Project description

**NodeJS** Project: so just Javascript knowledges are needed.

**Postgres** Database: one of most common relation DBMS and usable for free on Heroku hosting.

**Mithril** framework: not very known  but it is one of the lightest and simplest framework for powerful frontend develop.


## Settings
Settings are provided using environment variables. You can create yours or simply copy and paste following in a `.env` file before running the project. This `.env` file is used both by NodeJS application or Docker-compose.
```
POSTGRES_PASSWORD=dev-pwd
POSTGRES_USER=dev-user
POSTGRES_DB=capstone
POSTGRES_SERVER=database
HMAC=LqntbFvXfP1CGPQeOapV3SXAxSdartx8j62+enxCMXQ=

```

- **HMAC**: contains a key to generate the cryptographic HMAC hash. You can use the one provided in `.env` file or replace it using the following command: 

```
openssl rand -base64 32
```

- **POSTGRES_USER**: DB User
- **POSTGRES_PASSWORD**: Its password
- **POSTGRES_DB**: The Database name
- **POSTGRES_SERVER**: Database server address
- **DATABASE**: contains the full connection string to the postgres database. This one is not required and will overriding POSTGRES_* values.

Of course, values provided in `.env` file are only used to run locally and other values are set on the server.

## Running the project

I recommand the usage of Docker to run this project because it will give you a stable and complete environment for this project running on every OS you could have. NodeJS development under Windows environment can be painful.

Docker-Compose allows you to run at once the database, an interface to navigate inside it and the Web application.

Otherwise you need to install:
- Postgres
- NodeJS and NPM

