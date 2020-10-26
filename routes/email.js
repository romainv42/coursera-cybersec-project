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

        const { user_id, kind } = rows[0]
        try {
            if (kind === "VALID") {
                await dbHelper.users.validateEmail(user_id)
            }
            res.redirect("/email-verified")
        } catch (e) {
            res.redirect("/wrong-email")
        }
    })
}