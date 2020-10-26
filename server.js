const path = require("path")
const fs = require("fs")
const {
    NODE_ENV,
    DATABASE_URL,
    POSTGRES_PASSWORD,
    POSTGRES_USER,
    POSTGRES_DB,
    POSTGRES_SERVER,
    SENDGRID_API_KEY,
    SENDGRID_SENDER,
    HMAC,
} = process.env

const fastify = require("fastify")({
    logger: {
        prettyPrint: !(NODE_ENV === "production")
    },
    ...(NODE_ENV === "production" || {
        https: {
            key: fs.readFileSync('./secrets/localhost.key'),
            cert: fs.readFileSync('./secrets/localhost.crt')
        }
    })
})

// Initiate plugin to serve static files
fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/assets/',
})

// Initiate plugin for session management
fastify.register(require("fastify-cookie"))
fastify.register(require("fastify-session"), { secret: HMAC })

// Initiate OAS plugin, enjoy API documentation at /documentation
fastify.register(require("fastify-oas"), {
    routePrefix: '/documentation',
    swagger: {
        info: {
            title: 'Capstone project Open API',
            description: '',
            version: '1.0.0',
        },
        externalDocs: {
            url: 'https://swagger.io',
            description: 'Find more info here',
        },
        consumes: ['application/json'],
        produces: ['application/json'],
    },
    exposeRoute: true
});


// Initiate our CSRF protection plugin
fastify.register(require("./plugins/csrf"))

// Initiate our Mailer plugin
fastify.register(require("./plugins/sendgrid"), {
    apiKey: SENDGRID_API_KEY,
    sender: SENDGRID_SENDER,
})


// Initiate our Database Helper Plugin
fastify.register(require("./plugins/database"), {
    connectionString: DATABASE_URL,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
    server: POSTGRES_SERVER,
})

// Configure route to get initial CSRF token
fastify.register(require("./routes/csrf"), { prefix: "/api/csrf" })

// Configure route for user API
fastify.register(require("./routes/users"), { prefix: "/api/users" })

// Configure route for email verification
fastify.register(require("./routes/email"), { prefix: "/from-email" })

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