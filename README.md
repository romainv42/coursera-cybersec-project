# coursera-cybersec-project

## Running

**Before running the project, please read the Settings section below**

The project is based on Node JS 14. The best way to run the project is to use Docker.
The Makefile in the project provides two ways to launch the web server:
- `make` or `make docker`: this command will use *docker-compose* to start the database and the server. You must have installed Docker and Docker-compose.
- `make node`: this command runs the server without Docker. You must have Node JS v14+ and NPM installed.

In the last case, you must have a Postgres server running and set the access in the `.env` file.

In both case, `make init` is automatically runned.
This step will:

1. Create `.env` file with values found in `.env.base`
2. Create a folder `secrets`
4. Create RSA key pair to be used with the server
5. Create certificate to use TLS in localhost (your browser will warn you for unknown certificate, it's normal :) )
6. Setting creepy `chmod 777` on `secret` folder, required for Docker, just on your localhost, don't worry.

## Settings
Settings are provided using environment variables. You can create yours or simply copy and paste following in a `.env` file before running the project. This `.env` file is used both by NodeJS application or Docker-compose. Final `.env` file should look like this:

```
NODE_ENV=development
POSTGRES_PASSWORD=dev-pwd
POSTGRES_USER=dev-user
POSTGRES_DB=capstone
POSTGRES_SERVER=database
TWOFA_APP_NAME=capstone-project-romainv42
SMTP_SERVER=smtp.example.com
SMTP_PORT=465
SMTP_USER=your.user@example.com
SMTP_PASSWORD=your.password
SENDER=your.user@example.com
HMAC=BASE64ENCODINGSTRING
RSA_PASS=BASE64ENCODINGSTRING

```

### Emails
For obvious reason, I don't give you my SMTP credentials. **Please provide yours** in `.env.base` before 
running the app.
```
SMTP_SERVER=smtp.example.com
SMTP_PORT=465
SMTP_USER=your.user@example.com
SMTP_PASSWORD=your.password
SENDER=your.user@example.com
```

### Database
Default values will be used for Docker. You can customize this variable to connect to your own database:
- **POSTGRES_USER**: DB User
- **POSTGRES_PASSWORD**: Its password
- **POSTGRES_DB**: The Database name
- **POSTGRES_SERVER**: Database server address
- **DATABASE**: contains the full connection string to the postgres database. This one is not required and will overriding POSTGRES_* values.

As required, you can dump the database using the URL provided on Coursera.
If you run the project with Docker-Compose, you can view data directly by connecting to http://localhost:8080.

### Security
- **HMAC**: contains a key to generate the cryptographic HMAC hash. You can generate one using the following command: 
```
openssl rand -base64 32
```

- **RSA_PASS**: contains a passphrase to cipher the RSA private key before storing it on the storage. Cipher used is AES-256-GCM. You can generate it by using the same command as previous.

Due to ephemeral storage of Heroku, RSA Keys are passed as environment variable. If these variables is missing, the server tries to load `secrets/rsa-public.pem` and `secrets/rsa-private.pem` files.



Of course, values provided in `.env` file are only used to run locally and other values are set on the server.


## Project description

**NodeJS** Project: so just Javascript knowledges are needed.

**Postgres** Database: one of most common relation DBMS and usable for free on Heroku hosting.

**Mithril** framework: not very known  but it is one of the lightest and simplest framework for powerful frontend develop.

## API Documentation

API Documentation is accessible at the address: `/documentation`