const {
    base64url,
    randomBase64,
    hmac,
} = require("../../../utils")

module.exports = function (pool) {
    const co = pool

    return {
        getToken: async function (user_id) {
            const code = base64url(randomBase64(16))

            await co.query(`INSERT INTO "reset_tokens" VALUES ($1, $2)
            ON CONFLICT(user_id) DO UPDATE SET token=$2`, [
                user_id,
                hmac(code),
            ])

            return code
        },
        getUser: function (token) {

            return co.query(`SELECT u.user_id, u.login FROM reset_tokens 
            INNER JOIN users u USING (user_id)
            WHERE token=$1`, [
                hmac(token)
            ])
        },
        deleteRow: function (user_id, token) {
            return co.query("DELETE FROM reset_tokens WHERE user_id=$1 AND token=$2", [
                user_id,
                hmac(token),
            ])
        }
    }
}