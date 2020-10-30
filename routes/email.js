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
            if (kind === dbHelper.emails.KINDS.validation) {
                await dbHelper.users.validateEmail(user_id)
                res.redirect("/email-verified")
                return
            }
            if (kind === dbHelper.emails.KINDS.forgotPwd) {
                const reset = await dbHelper.reset.getToken(user_id)
                res.redirect(`/forgot-password?token=${reset}`)
                return
            }
            res.redirect("/wrong-email")
        } catch (e) {
            req.log.error(e)
            res.redirect("/wrong-email")
        }
    })
}