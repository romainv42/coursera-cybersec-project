const VALID_EMAIL_EXPIRES = 1000 * 60 * 60 * 24 // 24 hours in milliseconds

module.exports = async function (fastify) {
    const { dbHelper, csrf, mailer } = fastify

    // fastify.addHook('onRequest', csrf.check)

    fastify.get("/exists", {
        schema: require("../schemas/users/exists.json")
    }, async (req) => {
        const { login, email } = req.query

        const [
            { rows: loginExists },
            { rows: emailExists },
        ] = await Promise.all([
            login && dbHelper.users.exists("login", login) || {},
            email && dbHelper.users.exists("email", email) || {},
        ])

        req.log.debug({ login, email })
        return {
            loginExists: !!loginExists?.length,
            emailExists: !!emailExists?.length,
        }
    })

    fastify.post("/register", {
        schema: require("../schemas/users/register.json")
    }, async (req, res) => {
        const { authenticationMode } = req.body
        if (authenticationMode === "PWD") {
            const { password, confirmPwd } = req.body.auth
            if (password !== confirmPwd) {
                throw {
                    status: 400,
                    message: "Password and confirmation mismatched.",
                }
            }
        }
        const user_id = await dbHelper.users.register(req.body)
        const validationCode = await dbHelper.emails.createEmail(user_id, dbHelper.emails.KINDS.validation, new Date(Date.now() + VALID_EMAIL_EXPIRES))
        await mailer.send({
            to: req.body.email,
            subject: "Validate your registration",
            content: `
<h1>Welcome</h1>
<p>Just one more step to use the messenger</P>
<p>Click on the following link or copy and paste it in you browser</p>
<p><a href="https://romainv42-capstone-project.herokuapp.com/from-email/${validationCode}">https://romainv42-capstone-project.herokuapp.com/from-email/${validationCode}</a>
`
        })
        res.status(201).send("User successfully registered")
    })
}