const fastifyPlugin = require("fastify-plugin")

const speackeasy = require("speakeasy")

async function twoFactor(fastify, { appName }) {
    fastify.decorate("twoFactor", {
        generate: async function () {
            const secret = speackeasy.generateSecret({
                name: appName
            })

            return secret
        },
        verify: function (secret, token) {
            return speackeasy.totp.verify({ secret, token, encoding: "base32" })
        }
    })
}

module.exports = fastifyPlugin(twoFactor)