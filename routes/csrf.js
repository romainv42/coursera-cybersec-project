module.exports = async (fastify) => {
    const { csrf } = fastify

    fastify.get("/", (_, reply) => {
        const token = csrf.create()
        reply.header(csrf.TOKEN_H_KEY, token).status(204).send()
    })
}