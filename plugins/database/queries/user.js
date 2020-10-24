const crypto = require("crypto")

const key = Buffer.from(process.env.HMAC, "base64")

const hashPassword = (pwd) => {
    return crypto.createHmac("sha256", )
        .update(pwd)
        .digest("base64")
}

module.exports = function (pool) {
    const co = pool

    return {
        search: function (login) {
            return co.query("SELECT * FROM Users WHERE email=$1", [email])
        },
        register: function (email, login, password) {

        }
    }
}