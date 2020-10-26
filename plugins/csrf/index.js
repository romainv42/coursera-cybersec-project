const fastifyPlugin = require("fastify-plugin")

const {
    base64url,
    randomBase64,
} = require("../../utils")

const tokens = []

const TOKEN_H_KEY = "x-csrf-token"

function csrf(fastify, _, done) {
    const createCsrf = function () {
        const token = base64url(randomBase64(16))
        tokens.push(token)
        return token
    }

    fastify.decorate("csrf", {
        TOKEN_H_KEY,
        create: createCsrf,
        check: function (request, reply, next) {
            const token = request.headers[TOKEN_H_KEY]
            if (!token) {
                return reply.status(412).send("missing CSRF token")
            }
            const idx = tokens.indexOf(token)
            if (idx < 0) {
                return reply.status(412).send("Bad CSRF token")
            }
            tokens.splice(idx, 1)
            reply.header(TOKEN_H_KEY, createCsrf())
            next()
        }
    })
    done()
}

module.exports = fastifyPlugin(csrf)