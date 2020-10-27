const {
    randomBase64,
} = require("../../../utils")

module.exports = function (pool) {
    const co = pool

    return {
        get: function (user_id, session_id) {
            return co.query(`SELECT 1 FROM sessions 
            WHERE user_id=$1 AND session_id=$2 AND expiration > $3`, [
                user_id,
                session_id,
                new Date(),
            ])
        },
        create: async function (user_id, expiration) {
            const session = randomBase64(32)
            await co.query("INSERT INTO sessions VALUES ($1, $2, $3)", [user_id, session, expiration])
            return session
        },
        logout: function (user_id, session_id) {
            return co.query("DELETE FROM sessions WHERE user_id=$1 AND session_id=$2", [user_id, session_id])
        }
    }
}