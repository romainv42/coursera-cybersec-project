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
                    user.login.trim(),
                    user.email.trim(),
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
                    await this.addAuthenticator(user_id, auth, "Registration")
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
        addAuthenticator: function (user_id, auth, name) {
            return co.query(`INSERT INTO authenticators
            ("user_id", "name", "fmt", "counter", "publicKey", "credID")
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                user_id,
                name,
                auth.fmt,
                auth.counter,
                auth.publicKey,
                auth.credID,
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
            return co.query(`SELECT login, email FROM users WHERE user_id=$1`, [user_id])
        },
        updatePassword: function (user_id, password) {
            return co.query(`INSERT INTO password VALUES
            ($2, $1) ON CONFLICT(user_id) DO UPDATE SET hashed=$1`, [
                hmac(password),
                user_id
            ])
        },
        updateEmail: function (user_id, email) {
            return co.query("UPDATE users SET email=$1, validated=false WHERE user_id=$2", [
                email,
                user_id,
            ])
        },
        updateAuthNames: function (user_id, authenticators) {
            return Promise.all(authenticators.map(({ credID, name }) => 
            co.query("UPDATE authenticators SET name=$1 WHERE user_id=$2 AND \"credID\"=$3", [
                name,
                user_id,
                credID,
            ])))
        },
        deleteAuthr: function (user_id, credID) {
            return co.query("DELETE FROM authenticators WHERE user_id=$1 AND \"credID\"=$2", [
                user_id,
                credID,
            ])
        },
        add2FA: function (user_id, name, secret) {
            return co.query("INSERT INTO two_factor (user_id, name, secret) VALUES ($1, $2, $3)", [
                user_id,
                name || `Two-Factor App ${new Date().toDateString()}`,
                secret,
            ])
        },
        get2FA: function (user_id) {
            return co.query("SELECT * FROM two_factor WHERE user_id=$1", [
                user_id,
            ])
        },
        delete2FA: function (user_id, id) {
            return co.query("DELETE from two_factor WHERE user_id=$1 AND twofa_id=$2", [
                user_id,
                id,
            ])
        },
        update2FAnames: function (user_id, twoFA) {
            return Promise.all(twoFA.map(({ twofa_id, name}) => 
                co.query("UPDATE two_factor SET name=$1 WHERE user_id=$2 AND twofa_id=$3", [
                    name,
                    user_id,
                    twofa_id,
                ])
            ))
        }
    }
}