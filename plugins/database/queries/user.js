const crypto = require("crypto")
const { hmac } = require("../../../utils/index")

module.exports = function (pool) {
    const co = pool

    return {
        exists: function (field, value) {
            return co.query("SELECT 1 FROM users WHERE $1=$2", [field, value])
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