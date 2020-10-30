const fastifyPlugin = require("fastify-plugin")
const sgMail = require('@sendgrid/mail')

async function sendGrid (fastify, { apiKey, sender }) {
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
}

module.exports = fastifyPlugin(sendGrid)