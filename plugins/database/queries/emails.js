const {
    base64url,
    randomBase64,
    hmac,
} = require("../../../utils")

const KINDS = {
    validation: "VALID",
    forgotPwd: "FORGT"
}

module.exports = function (pool) {
    const co = pool

    return {
        KINDS,
        createEmail: async function (user_id, kind, deadTime) {
            if (!Object.values(KINDS).includes(kind)) throw "Invalid kind"

            const code = base64url(randomBase64(16))

            await co.query(`INSERT INTO emails
                (user_id, kind, code, not_after)
                VALUES ($1, $2, $3, $4)
            `, [
                user_id,
                kind,
                hmac(code),
                deadTime,
            ])

            return code
        },
        getEmail: function (code) {
            if (!code) throw "Code missing"

            return co.query("SELECT * FROM emails WHERE code = $1 AND not_after > $2", [
                hmac(code),
                new Date(),
            ])
        }
    }
}