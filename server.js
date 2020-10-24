const path = require("path")

const {
    NODE_ENV,
    DATABASE_URL,
    POSTGRES_PASSWORD,
    POSTGRES_USER,
    POSTGRES_DB,
    POSTGRES_SERVER,
} = process.env

const fastify = require("fastify")({
    logger: {
        prettyPrint: !(NODE_ENV === "production")
    }
})

// Initiate plugin to serve static files
fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/assets/',
})

// Initiate our Database Helper Plugin
fastify.register(require("./plugins/database"), {
    connectionString: DATABASE_URL,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
    server: POSTGRES_SERVER,
})

// Configure route for static files
fastify.register(require("./routes/static"))


// Launching the server
fastify.listen(process.env.PORT || 3000, "0.0.0.0", (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})