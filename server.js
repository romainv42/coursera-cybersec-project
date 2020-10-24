const path = require("path")

const fastify = require("fastify")({
    logger: {
        prettyPrint: true
    }
})

// Initiate plugin to serve static files
fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/', // optional: default '/'
})


// Configure Default Routes, returning index.html
fastify.register(require("./routes"))


// Launching the server
fastify.listen(process.env.PORT || 3000, "0.0.0.0", (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})