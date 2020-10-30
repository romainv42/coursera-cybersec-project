const fastifyPlugin = require("fastify-plugin")
const nodemailer = require('nodemailer')

async function sendGrid (fastify, { smtpServer, smtpPort, authUser, authPwd, sender }) {
    const transporter = nodemailer.createTransport({
        host: smtpServer,
        port: smtpPort,
        secure: true,
        auth: {
          user: authUser, // generated ethereal user
          pass: authPwd, // generated ethereal password
        },
      });

    const mailer = {
        send: ({ content, ...message }) => transporter.sendMail({
            ...message,
            from: sender,
            html: content,
            text: content.replace(/(<[^>]+>)/gmi, "")
        })
    }

    fastify.decorate("mailer", mailer)
}

module.exports = fastifyPlugin(sendGrid)