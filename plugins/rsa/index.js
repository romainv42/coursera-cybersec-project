const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const fastifyPlugin = require("fastify-plugin")

const RSA_SECRET = "rsa-secret.pem"
const RSA_PUBLIC = "rsa-public.pem"

async function rsa(fastify, { secretPath, passphrase }) {
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
    if (
        !fs.existsSync(path.join(secretPath, RSA_PUBLIC)) ||
        !fs.existsSync(path.join(secretPath, RSA_SECRET))
    ) {
        fastify.log.info("Creating the RSA Keypair")
        try {
            keyPair = crypto.generateKeyPairSync("rsa", {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                    cipher: 'aes-256-cbc',
                    passphrase: Buffer.from(passphrase, "base64"),
                }
            })
            fs.writeFileSync(path.join(secretPath, RSA_SECRET), keyPair.privateKey, {
                encoding: "ascii",
                flag: "w",
                mode: 0o400,
            })
            fs.writeFileSync(path.join(secretPath, RSA_PUBLIC), keyPair.publicKey, {
                encoding: "ascii",
                flag: "w",
                mode: 0o400,
            })
        } catch (e) {
            fastify.log.error(e)
            throw "Unable to create the RSA keypair"
        }
    } else {
        keyPair = {
            privateKey: crypto.createPrivateKey({
                key: fs.readFileSync(path.join(secretPath, RSA_SECRET), {
                    encoding: "ascii",
                }),
                passphrase: Buffer.from(passphrase, "base64"),
            }),
            publicKey: crypto.createPublicKey(fs.readFileSync(path.join(secretPath, RSA_PUBLIC), { encoding: "ascii" })),
        }
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
            return crypto.privateDecrypt(keyPair.privateKey, data)
        },
        sign: (input) => {
            const signature = crypto.createSign("sha256")
            signature.update(input)
            signature.end()
            return signature.sign(keyPair.privateKey)
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