const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const fastifyPlugin = require("fastify-plugin")

const RSA_SECRET = "rsa-secret.pem"
const RSA_PUBLIC = "rsa-public.pem"

async function rsa(fastify, { secretPath, passphrase, private, public }) {
    // Check secretPath

    if (!fs.existsSync(secretPath)) {
        fastify.log.info("Creating the secret path")
        fs.mkdirSync(secretPath, { recursive: true })
    }

    if (!passphrase) {
        throw "Missing Passphrase"
    }

    let keyPair
    // Check and load if key pair already exists

    keyPair = {
        privateKey: crypto.createPrivateKey({
            key: private,
            encoding: "ascii",
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: Buffer.from(passphrase, "base64"),
        }),
        publicKey: crypto.createPublicKey(public, { encoding: "ascii" }),
    }
   
    const checkAndConvert = (data, encoding) => {
        if (!Buffer.isBuffer(data)) {
            if (!encoding) {
                throw "Data must be a Buffer or a string with encoding option set!"
            }
            return Buffer.from(data, encoding)
        }
        return data
    }

    const helper = {
        encrypt: (input, { encoding }) => {
            const data = checkAndConvert(input, encoding)
            return crypto.publicEncrypt({
                key: keyPair.publicKey,
                padding: crypto.constants.RSA_NO_PADDING,
            }, data)
        },
        decrypt: (input, { encoding }) => {
            const data = checkAndConvert(input, encoding)
            return crypto.privateDecrypt({ key: keyPair.privateKey, passphrase }, data)
        },
        sign: (input) => {
            const signature = crypto.createSign("sha256")
            signature.update(input)
            signature.end()
            return signature.sign({ key: keyPair.privateKey, passphrase })
        },
        verify: (input, signature, { encoding }) => {
            const data = checkAndConvert(signature, encoding)
            const verify = crypto.createVerify("sha256")
            verify.update(input)
            verify.end()
            return verify.verify(keyPair.publicKey, data)
        }
    }

    fastify.decorate("rsa", helper)
}

module.exports = fastifyPlugin(rsa)