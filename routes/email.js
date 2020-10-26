module.exports = async function (fastify) {
    const { dbHelper } = fastify

    fastify.get("/:verificationCode", {
        schema: require("../schemas/email/verification.json")
    }, async (req, res) => {
        const { verificationCode } = req.params

        const { rows } = await dbHelper.emails.getEmail(verificationCode)
        if (!rows || !rows.length) {
            throw {
                statusCode: 404,
                error: "Email not found or expired"
            }
        }

        req.log.info(rows)
        return { cool: "raoul"}
    })
}