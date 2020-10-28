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
    RSA_PASS,
    RSA_PUBLIC,
    RSA_PRIVATE,
    SMTP_SERVER,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SENDER,
} = process.env

const {
    base64url,
    randomBase64,
} = require("./utils")

const fastify = require("fastify")({
    logger: {
        prettyPrint: true
    },
    ...(NODE_ENV === "production" || {
        https: {
            key: fs.readFileSync('./secrets/localhost.key'),
            cert: fs.readFileSync('./secrets/localhost.crt')
        }
    })
})

// Initiate Helmet plugin
fastify.register(require("fastify-helmet"), {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "unpkg.com"],
            styleSrc: ["'self'", "cdn.jsdelivr.net"],
            fontSrc: ["'self'"],
            imgSrc: ["'self'",],
            upgradeInsecureRequests: [],
        }
    }
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

// Initiate our RSA Helper
fastify.register(require("./plugins/rsa"), {
    passphrase: RSA_PASS,
    private: RSA_PRIVATE || fs.readFileSync(path.join(__dirname, "secrets/rsa-private.pem"), { encoding: "ascii" }),
    public: RSA_PUBLIC || fs.readFileSync(path.join(__dirname, "secrets/rsa-public.pem"), { encoding: "ascii" }),
})

// Initiate our JWT Helper using the RSA Helper
fastify.register(require("./plugins/jwt"), {
    issuer: "romainv42-capstone-project.herokuapp.com"
})

// Initiate our AES Helper
fastify.register(require("./plugins/aes"))

// Initiate our Mailer plugin
// fastify.register(require("./plugins/mailer/sendgrid"), {
//     apiKey: SENDGRID_API_KEY,
//     sender: SENDGRID_SENDER,
// })
fastify.register(require("./plugins/mailer/smtp"), {
    smtpServer:SMTP_SERVER,
    smtpPort:SMTP_PORT,
    authUser:SMTP_USER,
    authPwd:SMTP_PASSWORD,
    sender: SENDER,
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

// Configure route to check cookie
fastify.register(require("./routes/cookie"), { prefix: "/api/cookie" })

// Configure route for email verification
fastify.register(require("./routes/email"), { prefix: "/from-email" })

// Configure route to manage messages
fastify.register(require("./routes/messages"), { prefix: "/api/messages" })

// Configure route for static files
fastify.register(require("./routes/static"))

// Coursera required DUMP
fastify.register(require("./routes/dump"))


// Launching the server
fastify.listen(process.env.PORT || 5813, "0.0.0.0", (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})