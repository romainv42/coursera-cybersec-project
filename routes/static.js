module.exports = async (fastify) => {
    fastify.setNotFoundHandler(function (request, reply) {
        reply.sendFile("index.html")
    })
}