module.exports = async (fastify) => {
    fastify.setNotFoundHandler(function (request, reply) {
        request.log.error({ error: 404, uri: request.url })
        reply.sendFile("index.html")
    })
}