const fastifyPlugin = require("fastify-plugin")
const {
    base64url
} = require("../../utils/index")

async function jwt(fastify, { issuer }) {
    const defaultHeader = base64url(Buffer.from('{"alg":"RS256","typ":"JWT"}', "utf8")
        .toString("base64"))

    const verify = (data) => {
        const [
            header,
            payloadB,
            signature,
        ] = data.split(".")
        if (!header || !payloadB || !signature) {
            throw "JWT Invalid format"
        }

        if (header !== defaultHeader) {
            throw "JWT JOSE Header manipulation"
        }

        if (!fastify.rsa.verify(`${header}.${payloadB}`, signature, { encoding: "base64" })) {
            throw "JWT Invalid signature"
        }

        const { iat, iss, exp, payload } = JSON.parse(Buffer.from(payloadB, "base64").toString("utf8"))
        if (!iat) {
            throw "JWT IAT field missing"
        } else if (iat > Math.floor(Date.now() / 1000)) {
            throw "JWT generated in the future!"
        }
        if (!iss) {
            throw "JWT ISS field missing"
        } else if (iss !== issuer) {
            throw "JWT generated by somebody else"
        }
        if (!exp) {
            throw "JWT EXP field missing"
        } else if (exp < Math.floor(Date.now() / 1000)) {
            throw "JWT expired"
        }

        return payload
    }

    fastify.decorate("jwt", {
        generate: (data, duration) => {
            const payload = {
                iat: Math.floor(Date.now() / 1000),
                iss: issuer,
                exp: Math.floor((Date.now() + duration) / 1000),
                payload: data
            }
            const unsigned = `${defaultHeader}.${base64url(Buffer.from(JSON.stringify(payload), "utf8").toString("base64"))}`

            const signature = fastify.rsa.sign(unsigned)
            return `${unsigned}.${base64url(signature.toString("base64"))}`
        },
        verifyHook: async (request, reply) => {
            let token
            try {
                if (request.headers.authorization) {
                    request.log.info("Authorization header found")
                    token = request.headers.authorization.replace("Bearer ", "")
                } else if (request.cookies.token) {
                    request.log.info("Cookie found")
                    token = request.cookies.token
                } else {
                    throw "No JWT found"
                }
                const { user_id, session_id } = verify(token)
                const { rows } = await fastify.dbHelper.session.get(user_id, session_id)
                if (!rows && !rows.length) {
                    throw "No session found or it expired"
                }
                request.user = { user_id, session_id }
                return
            } catch (e) {
                request.log.info(`Not authorized. Cause: ${e}`)
                reply.status(401).send({ error: e })
                return
            }
        }
    })
}

module.exports = fastifyPlugin(jwt)