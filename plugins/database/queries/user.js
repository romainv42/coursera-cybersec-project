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
            return co.query("SELECT * FROM Users WHERE email=$1", [email])
        },
        register: async function ({ authenticationMode, auth, ...user}) {
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
        }
    }
}