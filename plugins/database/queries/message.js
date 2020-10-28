module.exports = function (pool) {
    const co = pool

    return {
        getList: async (user_id) => {
            return co.query(`SELECT 
                    f.login as sender_login,
                    t.login as recipient_login,
                    m.*
                FROM messages m
                INNER JOIN users f ON m."from" = f.user_id
                INNER JOIN users t ON m.to = t.user_id
                WHERE m."from" = $1 OR m.to = $1
                ORDER BY m.message_id DESC`, [
                    user_id
                ])
        },
        save: async (from, to, content, key, iv, auth) => {
            return co.query(`INSERT INTO messages 
                ("from", "to", "content", "read", "key", "iv", "auth") VALUES 
                ($1, $2, $3, false, $4, $5, $6)
                `, [
                    from,
                    to,
                    content,
                    key,
                    iv,
                    auth,
                ])
        }
    }
}