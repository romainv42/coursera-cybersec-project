module.exports = async function (fastify) {
    const { csrf, jwt, dbHelper } = fastify
    fastify.addHook('onRequest', csrf.check)

    fastify.get("/check", {
        preValidation: [jwt.verifyHook],
    }, async (req) => {
        const { user_id } = req.user
        const { rows } = await dbHelper.users.getLoginById(user_id)
        const res = (rows || [])[0]
        return {
            username: res?.login
        }
    })
}