const crypto = require("crypto")
const fastifyPlugin = require("fastify-plugin")

const ALG = "aes-256-gcm"

const {
    checkAndConvert,
} = require("../../utils")

async function aesHelper(fastify) {
    fastify.decorate("aes", {
        encrypt: (content, { encoding }) => {
            const key = crypto.randomBytes(32)
            const iv = crypto.randomBytes(32)
            const cipher = crypto.createCipheriv(
                ALG,
                crypto.createSecretKey(key),
                iv,
                { authTagLength: 16 }
            )

            let encrypted = cipher.update(content, encoding, "base64")
            encrypted += cipher.final("base64")
            const authTag = cipher.getAuthTag()
            return {
                key,
                encrypted,
                iv,
                authTag
            }
        },
        decrypt: (data, key, iv, authTag, { encoding })  =>{
            const decipher = crypto.createDecipheriv(
                ALG,
                crypto.createSecretKey(key),
                iv,
                { authTagLength: 16 }
            )
            decipher.setAuthTag(authTag)
            let plain = decipher.update(data, "base64", encoding)
            plain += decipher.final(encoding)
            return plain
        }
    })
}

module.exports = fastifyPlugin(aesHelper)