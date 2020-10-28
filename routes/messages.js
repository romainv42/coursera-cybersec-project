const { default: fastify } = require("fastify");

module.exports = async (fastify) => {

    const { dbHelper, aes, rsa, csrf, jwt } = fastify

    fastify.addHook('onRequest', csrf.check)
    fastify.addHook('onRequest', jwt.verifyHook)


    fastify.post("/send", {
        schema: require("../schemas/messages/send.json")
    }, async (req, res) => {

        const sender = req.user.user_id
        const { message, recipient } = req.body

        const { rows: users } = await dbHelper.users.search(recipient)
        if (!users || !users.length) {
            throw {
                statusCode: 400,
                error: "User doesn't exist."
            }
        }

        const cipher = aes.encrypt(
            JSON.stringify({ message, date: Date.now() }),
            { encoding: "utf8" },
        )
        const key = rsa.encrypt(cipher.key, {})
        await dbHelper.messages.save(
            sender,
            users[0].user_id,
            cipher.encrypted,
            key.toString("base64"),
            cipher.iv.toString("base64"),
            cipher.authTag.toString("base64")
        )

        res.status(201).send("message sent")
    })


    fastify.get("/list", {
        schema: require("../schemas/messages/list.json")
    }, async (req) => {
        const { user_id } = req.user
        const { rows: messages } = await dbHelper.messages.getList(user_id)
        return Promise.all(messages.map(m => {
            const key = rsa.decrypt(m.key, { encoding: "base64" })

            return {
                ...m,
                content: JSON.parse(aes.decrypt(
                    Buffer.from(m.content, "base64"),
                    key,
                    Buffer.from(m.iv, "base64"),
                    Buffer.from(m.auth, "base64"),
                    { encoding: "utf8" },
                )),
            }
        }))
    })
}