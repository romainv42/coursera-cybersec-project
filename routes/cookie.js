module.exports = async function (fastify) {
    const { jwt, dbHelper } = fastify

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