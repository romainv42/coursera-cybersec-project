module.exports = async (fastify) => {
    fastify.get("/", (_, reply) => reply.sendFile("index.html"))
}