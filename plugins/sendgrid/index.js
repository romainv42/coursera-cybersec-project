const fastifyPlugin = require("fastify-plugin")
const sgMail = require('@sendgrid/mail')

const sendGrid = function (fastify, { apiKey, sender }, done) {
    sgMail.setApiKey(apiKey)

    const mailer = {
        send: ({ content, ...message }) => sgMail.send({
            ...message,
            from: sender,
            html: content,
            text: content.replace(/(<[^>]+>)/gmi, "")
        })
    }

    fastify.decorate("mailer", mailer)
    done()
}

module.exports = fastifyPlugin(sendGrid)