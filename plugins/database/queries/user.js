const crypto = require("crypto")
const { hmac } = require("../../../utils/index")

module.exports = function (pool) {
    const co = pool

    return {
        exists: function (field, value) {
            let query
            if (field === "email") {
                query = "SELECT 1 FROM users WHERE email=$1"
            }
            if (field === "login") {
                query = "SELECT 1 FROM users WHERE login=$1"
            }

            return co.query(query, [value])
        },
        search: function (login) {
            return co.query("SELECT * FROM Users WHERE validated=true AND (email=$1 OR login=$1)", [login])
        },
        register: async function ({ authenticationMode, auth, ...user }) {
            await co.query("BEGIN TRANSACTION")
            try {
                const { rows } = await co.query(`INSERT INTO users 
                ("login", "email", "moreInfo", "changePassword", "validated") 
                VALUES ($1, $2, $3, false, false) RETURNING user_id;`, [
                    user.login,
                    user.email,
                    user.moreInfo,
                ])
                if (!rows.length) {
                    throw "User not inserted"
                }
                const { user_id } = rows[0]
                if (authenticationMode === "PWD") {
                    await co.query(`INSERT INTO password  VALUES($1, $2)`, [
                        user_id,
                        hmac(auth.password),
                    ])
                } else if (authenticationMode === "WAN") {
                    await co.query(`INSERT INTO authenticators
                        ("user_id", "name", "fmt", "counter", "publicKey", "credID")
                        VALUES ($1, 'Registration', $2, $3, $4, $5)
                    `, [
                        user_id,
                        auth.fmt,
                        auth.counter,
                        auth.publicKey,
                        auth.credID,
                    ])
                } else {
                    throw {
                        statusCode: 400,
                        error: "Invalid authentication mode"
                    }
                }
                await co.query("COMMIT")
                return user_id
            } catch (e) {
                await co.query("ROLLBACK")
                throw e
            }
        },
        updateAuthr: function (user_id, { counter, credID }) {
            return co.query(`UPDATE authenticators SET counter=$1 
                WHERE user_id=$2 AND "credID"=$3`, [
                    counter,
                    user_id,
                    credID,
            ])
        },
        validateEmail: async function (user_id) {
            const { rows } = await co.query("SELECT validated FROM users WHERE user_id=$1", [user_id])
            if (!rows || !rows.length) {
                throw "User doesn't exist"
            }
            const { validated } = rows[0]
            if (validated) {
                throw "Email address already validated"
            }
            return co.query("UPDATE users SET validated=true WHERE user_id=$1", [user_id])
        },
        hasPasswordAuth: function (user_id) {
            return co.query("SELECT 1 FROM password WHERE user_id=$1", [user_id])
        },
        getAuthenticators: function (user_id) {
            return co.query(`SELECT "name", "fmt", "counter", "publicKey", "credID" from authenticators WHERE user_id=$1`, [user_id])
        },
        identifyByPassword: function (user_id, password) {
            return co.query(`SELECT 1 FROM password WHERE user_id=$1 AND hashed=$2`, [
                user_id,
                hmac(password),
            ])
        },
        getLoginById: function (user_id) {
            return co.query(`SELECT login FROM users WHERE user_id=$1`, [user_id])
        }
    }
}