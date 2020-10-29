const H24_EXPIRES = 1000 * 60 * 60 * 24 // 24 hours in milliseconds

module.exports = async function (fastify) {
    const { dbHelper, csrf, mailer, jwt } = fastify

    fastify.addHook('onRequest', csrf.check)
    fastify.addHook('onRequest', jwt.verifyHook)

    fastify.get("/login", {
        schema: require("../schemas/account/login.json")
    }, async (req) => {
        const { user_id } = req.user

        const { rows } = await dbHelper.users.getLoginById(user_id)
        if (!rows || !rows.length) {
            throw {
                statusCode: 401,
                error: "User doesn't exist"
            }
        }

        return {
            ...rows[0]
        }
    })

    fastify.get("/auth-modes", {
        schema: require("../schemas/account/auth-modes.json")
    }, async (req) => {
        const { user_id } = req.user

        const [
            { rows: password },
            { rows: authenticators },
        ] = await Promise.all([
            dbHelper.users.hasPasswordAuth(user_id),
            dbHelper.users.getAuthenticators(user_id),
        ])

        return {
            "has-password": password && password.length,
            "authenticators": authenticators,
        }
    })

    fastify.post("/update/email", {
        schema: require("../schemas/account/update-email.json")
    }, async (req) => {
        const { email } = req.body
        const { user_id } = req.user

        const { rows } = await dbHelper.users.getLoginById(user_id)
        if (!rows || !rows.length) {
            throw {
                statusCode: 401,
                error: "User doesn't exist"
            }
        }

        if (email.trim() === rows[0].email) {
            return "Same email"
        }

        await dbHelper.users.updateEmail(user_id, email.trim())
        const validationCode = await dbHelper.emails.createEmail(user_id, dbHelper.emails.KINDS.validation, new Date(Date.now() + H24_EXPIRES))
        await mailer.send({
            to: email,
            subject: "Validate your registration",
            content: `
<h1>Welcome</h1>
<p>Just one more step to use the messenger</P>
<p>Click on the following link or copy and paste it in you browser</p>
<p><a href="https://romainv42-capstone-project.herokuapp.com/from-email/${validationCode}">https://romainv42-capstone-project.herokuapp.com/from-email/${validationCode}</a></p>
<p><i>This email expires in 24 hours.</i></p>
`
        })
        return "Email address updated, validation email sent"
    })

    fastify.post("/devices/update", {
        schema: require("../schemas/account/update-devices.json")
    }, async (req) => {
        const { authenticators } = req.body
        const { user_id } = req.user

        await dbHelper.users.updateAuthNames(user_id, authenticators)
        return "Authenticators updated"
    })

    fastify.post("/devices/delete", {

    }, async (req, res) => {
        const { credID } = req.body
        const { user_id } = req.user
        if (!credID) {
            throw {
                statusCode: 400,
                error: "Authenticator device ID is required (aka credID)"
            }
        }
        await dbHelper.users.deleteAuthr(user_id, credID)
        res.status(204)
        return
    })
}