const H24_EXPIRES = 1000 * 60 * 60 * 24 // 24 hours in milliseconds
const WEEK_EXPIRES = H24_EXPIRES * 7 // A week in milliseconds

const ORIGIN = process.env.NODE_ENV === "production" ?
    "romainv42-capstone-project.herokuapp.com" :
    "localhost"

const {
    randomBase64,
    base64url,
} = require("../utils")

const {
    verifyAuthenticatorAttestationResponse,
    verifyAuthenticatorAssertionResponse,
    generateServerGetAssertion
} = require("../utils/webauthn")


const passwordRequirements = (password) => (
    /[a-z]+/.test(password) &&
    /[A-Z]+/.test(password) &&
    /[0-9]+/.test(password) &&
    /[^a-zA-Z0-9]+/.test(password) &&
    password.length >= 8
)

const validateAuthenticator = (authenticator, challenge) => {
    const webauthNResponse = authenticator
    const clientData = JSON.parse(
        Buffer.from(webauthNResponse.response.clientDataJSON, "base64")
            .toString("utf-8")
    )

    if (clientData.challenge !== challenge) {
        throw {
            statusCode: 400,
            error: "Challenge mismatched!"
        }
    }
    const currentOrigin = `https://${ORIGIN + (process.env.NODE_ENV !== "production" ? ":5813" : "")}`
    if (clientData.origin !== currentOrigin) {
        throw {
            statusCode: 400,
            error: "Origin mismatched!"
        }
    }

    const response = verifyAuthenticatorAttestationResponse(webauthNResponse.response)
    if (!response) throw {
        statusCode: 400,
        error: "WebAuthn Invalid response"
    }

    return response
}

module.exports = async function (fastify) {
    const { dbHelper, csrf, mailer, jwt, twoFactor, rsa } = fastify

    fastify.addHook('onRequest', csrf.check)

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

            if (!passwordRequirements(password)) {
                throw {
                    status: 400,
                    message: "Password doesn't respect requirements.",
                }
            }
        }

        if (authenticationMode === "WAN") {
            req.body.auth = validateAuthenticator(req.body.auth, req.session.challenge)
            req.session.challenge = null
        }

        const user_id = await dbHelper.users.register(req.body)
        const validationCode = await dbHelper.emails.createEmail(user_id, dbHelper.emails.KINDS.validation, new Date(Date.now() + H24_EXPIRES))
        await mailer.send({
            to: req.body.email,
            subject: "Validate your registration",
            content: `
<h1>Welcome</h1>
<p>Just one more step to use the messenger</P>
<p>Click on the following link or copy and paste it in you browser</p>
<p><a href="https://romainv42-capstone-project.herokuapp.com/from-email/${validationCode}">https://romainv42-capstone-project.herokuapp.com/from-email/${validationCode}</a></p>
<p><i>This email expires in 24 hours.</i></p>
`
        })
        res.status(201).send("User successfully registered")
    })

    fastify.post("/webauthn-challenge", {
        schema: require("../schemas/users/webauthn-challenge.json")
    }, async (req, res) => {
        const uid = randomBase64(32)
        const challenge = randomBase64(32)

        req.session = {
            ...req.session,
            challenge: base64url(challenge),
            uid: base64url(uid),
            login: req.body.login,
        }

        return {
            challenge,
            rp: {
                name: "Coursera Cybersecurity Capstone Project",
                id: ORIGIN,
            },
            user: {
                id: uid,
                name: req.body.login,
                displayName: req.body.login,
            },
            pubKeyCredParams: [{
                type: "public-key", alg: -7 // "ES256" IANA COSE Algorithms registry
            }],
            authenticatorSelection: {
                authenticatorAttachment: "cross-platform",
            },
            userVerification: "required",
            timeout: 60000,
            attestation: "direct",
        }
    })

    fastify.post("/sign-in", {
        shema: require("../schemas/users/signin.json")
    }, async (req, res) => {
        const { rows } = await dbHelper.users.search(req.body.login.trim())
        if (!rows || !rows.length) {
            return {}
        }
        const { user_id, login } = rows[0]
        const [
            { rows: password },
            { rows: authenticators },
            { rows: twoFactors },
        ] = await Promise.all([
            dbHelper.users.hasPasswordAuth(user_id),
            dbHelper.users.getAuthenticators(user_id),
            dbHelper.users.get2FA(user_id),
        ])
        const assertion = authenticators?.length && generateServerGetAssertion(authenticators)
        req.session.challenge = assertion.challenge

        return {
            login,
            passwordEnabled: password && password.length === 1,
            has2FA: twoFactors && twoFactors.length > 0,
            assertion,
        }
    })

    fastify.post("/identify", {
        schema: require("../schemas/users/identify.json")
    }, async (req, res) => {
        const { username, password, authenticator, remember, totp } = req.body

        const { rows } = await dbHelper.users.search(username.trim())
        if (!rows || !rows.length) {
            return {
                statusCode: 400,
                error: "User doesn't exist"
            }
        }
        const { user_id } = rows[0]

        const { rows: twoFactors } = await dbHelper.users.get2FA(user_id)

        let identified = false
        if (password) {
            const { rows: pwd } = await dbHelper.users.identifyByPassword(user_id, password)
            identified = pwd && pwd.length
        } else if (authenticator) {
            const { rows: authenticators } = await dbHelper.users.getAuthenticators(user_id)

            const clientData = JSON.parse(Buffer.from(authenticator.response.clientDataJSON, "base64").toString("utf8"));

            if (Buffer.from(clientData.challenge, "base64").toString("base64") !== req.session.challenge) {
                throw {
                    statusCode: 400,
                    error: "Challenge mismatched!"
                }
            }
            const currentOrigin = `https://${ORIGIN + (process.env.NODE_ENV !== "production" ? ":5813" : "")}`
            if (clientData.origin !== currentOrigin) {
                throw {
                    statusCode: 400,
                    error: "Origin mismatched!"
                }
            }

            identified = verifyAuthenticatorAssertionResponse(authenticator.response, authenticator.rawId, authenticators)
            if (identified) {
                await dbHelper.users.updateAuthr(user_id, identified)
            }
        } else {
            throw {
                statusCode: 400,
                error: "A Password or authenticator object is required"
            }
        }

        if (!identified) {
            throw {
                statusCode: 400,
                error: "Unable to authenticate the user"
            }
        }

        if (twoFactors && twoFactors.length) {
            if (!totp) {
                throw {
                    statusCode: 400,
                    error: "Missing 2 FA code"
                }
            }
            const twoGood = twoFactors.reduce((acc, cur) => acc || twoFactor.verify(
                rsa.decrypt(cur.secret, { encoding: "base64" }).toString("ascii"),
                totp
            ), false)

            console.log("2FA", twoGood)
            if (!twoGood) {
                throw {
                    statusCode: 400,
                    error: "Invalid"
                }
            }
            req.log.info("Successfull 2FA")
        }

        req.log.info("User successfully identified")

        const expiration = remember ? WEEK_EXPIRES : H24_EXPIRES
        const deadTime = new Date(Date.now() + expiration)
        const session_id = await dbHelper.session.create(user_id, deadTime)
        if (!session_id) {
            throw "Unable to create session in DB"
        }

        const token = jwt.generate({
            user_id,
            session_id
        }, expiration)

        if (!remember) {
            return { token, username }
        }
        res.setCookie("capstone-token", token, {
            domain: ORIGIN,
            path: "/",
            expires: deadTime,
            sameSite: "strict",
            secure: true,
        }).status(200).send({ username })
    })

    fastify.get("/logout", {
        preValidation: [jwt.verifyHook],
    }, async (req, res) => {
        const { user_id, session_id } = req.user
        await dbHelper.session.logout(user_id, session_id)
        res.clearCookie("token")
        res.status(204)
        return
    })

    fastify.post("/forgot-password", {
        schema: require("../schemas/users/forgot.json")
    }, async (req, res) => {
        const { rows } = await dbHelper.users.search(req.body.login.trim())

        if (!rows || !rows.length) {
            throw {
                statusCode: 400,
                error: "USer doesn't exists",
            }
        }

        const { user_id, email } = rows[0]

        const validationCode = await dbHelper.emails.createEmail(user_id, dbHelper.emails.KINDS.forgotPwd, new Date(Date.now() + H24_EXPIRES))
        await mailer.send({
            to: email,
            subject: "Reset your password",
            content: `
<h1>Hi!</h1>
<p>You just ask for a password reset. To do it:</P>
<p>Click on the following link or copy and paste it in you browser</p>
<p><a href="https://romainv42-capstone-project.herokuapp.com/from-email/${validationCode}">https://romainv42-capstone-project.herokuapp.com/from-email/${validationCode}</a></p>
<p><i>This email expires in 24 hours.</i></p>
`
        })
        res.status(201).send("User successfully registered")
    })

    const changePassword = async (req, res) => {
        const {
            token,
            login,
            oldPassword,
            newPassword,
            confirmPwd,
            authenticator
        } = req.body

        let user_id
        if (token) {
            const { rows: user } = await dbHelper.reset.getUser(token)
            if (!user || !user.length) {
                throw {
                    statusCode: 400,
                    error: "Invalid token",
                }
            }
            console.log(user[0].login, login.trim())
            if (user[0].login !== login.trim()) {
                throw {
                    statusCode: 400,
                    error: "Invalid login for given token",
                }
            }
            user_id = user[0].user_id
        } else {
            user_id = req.user?.user_id
            if (!user_id) {
                throw {
                    statusCode: 401,
                    error: "User not identified",
                }
            }

            const { rows: hasPwd } = await dbHelper.users.hasPasswordAuth(user_id)
            if (!oldPassword && newPassword && hasPwd && hasPwd.length) {
                throw {
                    statusCode: 400,
                    error: "User didn't provide old password"
                }
            }

            if (oldPassword && newPassword && hasPwd && hasPwd.length) {
                const { rows: pwd } = await dbHelper.users.identifyByPassword(user_id, oldPassword)
                if (!pwd || !pwd.length) {
                    throw {
                        statusCode: 400,
                        error: "Old password doesn't match",
                    }
                }
            }
        }

        if (newPassword) {
            if (newPassword !== confirmPwd) {
                throw {
                    statusCode: 400,
                    error: "Password and confirmation different",
                }
            }

            if (!passwordRequirements(newPassword)) {
                throw {
                    status: 400,
                    message: "Password doesn't respect requirements.",
                }
            }
            await dbHelper.users.updatePassword(user_id, newPassword)
        } else if (authenticator) {
            const result = validateAuthenticator(authenticator, req.session.challenge)
            req.session.challenge = null
            await dbHelper.users.addAuthenticator(user_id, result, `Reset ${new Date().toDateString()}`)
        } else {
            throw {
                statusCode: 400,
                error: "Impossible case ?!"
            }
        }

        if (token) {
            await dbHelper.reset.deleteRow(user_id, token)
        }

        res.status(201)
        return "Update completed!"
    }

    const pwdSchema = require("../schemas/users/reset.json")
    fastify.post("/password-reset", {
        schema: pwdSchema,
    }, changePassword)

    fastify.post("/password-change", {
        schema: pwdSchema,
        preValidation: jwt.verifyHook
    }, changePassword)
}