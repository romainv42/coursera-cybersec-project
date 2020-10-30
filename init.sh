#!/bin/sh
if [ ! -f "./.env" ]; then
    echo "### Creating .env file from .env.base"
    cp .env.base .env
    echo "HMAC=$(openssl rand -base64 32)" >> .env
fi

if [ ! -d "./secrets" ]; then
    echo "### Creating secrets directory"
    mkdir "./secrets"
fi

if [ ! -f "./secrets/rsa-private.pem" ]; then
    echo "### Creating RSA Key pair"
	openssl rand 32 > secrets/passphrase
	openssl genrsa -out secrets/rsa-private.pem -aes256 -passout file:secrets/passphrase 2048
	openssl rsa -in secrets/rsa-private.pem -out secrets/rsa-public.pem -passin file:secrets/passphrase
	echo "RSA_PASS=$(base64 ./secrets/passphrase)" >> .env
elif [ ! -f "./secrets/rsa-public.pem" ]; then
    echo "### Creating RSA Public key"
    openssl rsa -in secrets/rsa-private.pem -out secrets/rsa-public.pem -passin file:secrets/passphrase
fi

if [ ! -f "./secrets/localhost.crt" ]; then
    echo "### Creating localhost certificate for SSL"
    printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth" > secrets/cert.conf
    openssl req -x509 -out secrets/localhost.crt -keyout secrets/localhost.key \
    -newkey rsa:2048 -nodes -sha256 \
    -subj '/CN=localhost' -extensions EXT -config  secrets/cert.conf
fi

echo "### Setting right on secret files to allow server to use it"
chmod -R 777 ./secrets